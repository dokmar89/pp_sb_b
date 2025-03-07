// lib/actions/fio.ts
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const FIO_API_TOKEN = process.env.FIO_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Chybí Supabase konfigurace');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Pomocná funkce pro asynchronní čekání (pauzu)
async function pockej(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkFioPayments(transactionNumber: string) { //Takes transaction Number
    console.log(`checkFioPayments spuštěno s transactionNumber: ${transactionNumber}`); // Důležité! Hned na začátku

    if (!FIO_API_TOKEN) {
        throw new Error("FIO_API_TOKEN není nastaven v proměnných prostředí!"); // Zásadní: Házíme chybu, ne jen logujeme!
    }

    const dnes = new Date();
    const odData = format(dnes, "yyyy-MM-dd");
    const doData = format(dnes, "yyyy-MM-dd");

    // Poznámka: Pokud byste chtěli kontrolovat transakce za delší období,
    // musíte rozdělit dotaz na více dnů, protože Fio API má omezení na maximální délku období.

    const url = `https://fioapi.fio.cz/v1/rest/periods/${FIO_API_TOKEN}/${odData}/${doData}/transactions.json`;

    let pocetPokusu = 0;
    const maximalniPokusy = 5; // Maximální počet pokusů o stažení dat z Fio API
    let cekaciDoba = 1000;   // Počáteční čekací doba v milisekundách (1 sekunda)

    while (pocetPokusu < maximalniPokusy) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 409) {
                    // Fio API vrátilo 409 - Too Many Requests (příliš mnoho požadavků)
                    pocetPokusu++;
                    console.warn(`Fio API omezuje četnost požadavků (pokus ${pocetPokusu}). Čekám ${cekaciDoba / 1000} sekund...`);
                    await pockej(cekaciDoba);
                    cekaciDoba *= 2;  // Exponenciální backoff: zdvojnásobíme čekací dobu pro další pokus
                    continue;         // Zkusíme znovu (skočíme na začátek while cyklu)
                }
                // Jiné chyby než 409 (např. 500 Internal Server Error, 401 Unauthorized)
                // Ihned vyhodíme výjimku, aby se chyba dostala až do volajícího kódu (route handleru)
                throw new Error(`HTTP chyba! Status: ${response.status}, Text: ${await response.text()}`);
            }

            // Pokud jsme se dostali sem, odpověď od Fio API byla úspěšná (status 200 OK)
            const data = await response.json();

            if (!data.accountStatement?.transactionList?.transaction) {
                console.log("Žádné nové transakce (v aktuálním FIO výpisu)."); // Upřesnění
                return { status: 'pending' }; // Vrátíme 'pending'
            }

            // Procházíme jednotlivé transakce z Fio API
            for (const transakce of data.accountStatement.transactionList.transaction) {
                const variabilniSymbol = transakce.column5?.value; // Variabilní symbol (VS)
                const castka = transakce.column1?.value;           // Částka

                console.log('Přijatá FIO transakce:', {
                    VS: variabilniSymbol,
                    částka: castka,
                    typČástky: typeof castka // Pro kontrolu, zda je částka číslo
                });

                 if (typeof castka !== 'number') {
                    console.warn("Přeskočení transakce - castka není číslo:", transakce);
                    continue;
                }

                if (!variabilniSymbol) {
                    //Skip if VS is missing.
                  continue;
                }


                // Only check against the *provided* transactionNumber
                if (String(variabilniSymbol) === transactionNumber) {
                   console.log(`Nalezen VS ${variabilniSymbol} shodující se s hledaným ${transactionNumber}`);

                    try {
                        const { data: naseTransakce, error: chybaHledani } = await supabase
                            .from('wallet_transactions')
                            .select('amount, id, company_id') // Select only necessary columns
                            .eq('transaction_number', transactionNumber)
                            .eq('status', 'pending')  // Make *sure* it's still pending!
                            .single();

                        if (chybaHledani) {
                            console.error("Chyba při hledání transakce v DB:", chybaHledani);
                             return { status: 'pending' }; // Treat DB errors as 'pending' (retry later)

                        }

                        if (!naseTransakce) {
                            // This should not happen, as route.ts pre-checks. Log for debugging.
                            console.warn("Transakce nebyla nalezena v DB (i když by měla být):", transactionNumber);
                            return { status: 'pending' };  // Consider it still pending

                        }


                        const ocekavanaCastka = naseTransakce.amount;
                        const prijataCastka = Math.round(Math.abs(castka));

                        console.log('Porovnání částek:', { // Detailní logování porovnání
                            očekáváno: ocekavanaCastka,
                            přijato: prijataCastka,
                            transactionNumber
                        });

                       if (ocekavanaCastka === prijataCastka) {
                            console.log(`Částky se shodují pro ${transactionNumber}, aktualizuji...`);
                            const { error: chybaAktualizace } = await supabase
                                .from('wallet_transactions')
                                .update({ status: 'completed' })
                                .eq('id', naseTransakce.id);

                            if (chybaAktualizace) {
                                console.error("Chyba při aktualizaci transakce:", chybaAktualizace);
                                return { status: 'pending' }; // Chyba při aktualizaci
                            }
                             const { data: firma, error: chybaFirmy } = await supabase
                                    .from('companies')
                                    .select('credit')
                                    .eq('id', naseTransakce.company_id)
                                    .single();

                                if (!chybaFirmy && firma) {
                                    const novyKredit = (firma.credit || 0) + ocekavanaCastka; // Přičteme částku k existujícímu kreditu
                                    await supabase
                                        .from('companies')
                                        .update({ credit: novyKredit })
                                        .eq('id', naseTransakce.company_id);
                                    console.log(`Kredit firmy ${naseTransakce.company_id} byl aktualizován na ${novyKredit}.`);
                                } else {
                                  console.error("Chyba při načítání firmy pro aktualizaci kreditu:", chybaFirmy);
                                }

                            console.log(`Transakce ${transactionNumber} AKTUALIZOVÁNA.`); // Úspěch!
                            return { status: 'completed' }; // Vrátíme 'completed'

                        } else {
                            console.warn(`Částky se NESHODUJÍ pro ${transactionNumber}`); // Log, pokud se částky neshodují
                            return { status: 'pending' }; // Vrátíme 'pending'
                        }

                    }  catch (error) {
                        console.error("Chyba uvnitř cyklu pro zpracování transakce:", error);
                         return { status: 'pending' }; // Treat processing errors as 'pending' (retry later)

                    }
                } //End If VS Matches

            } //End For Loop
            // If we get here, the transaction was not found in the Fio response
            console.log(`Transakce ${transactionNumber} NENALEZENA ve FIO datech.`); // Důležité!
            return { status: 'pending' };


        }  catch (error) {
            console.error("Obecná chyba v checkFioPayments:", error);
            if (pocetPokusu >= maximalniPokusy) {
                throw error; // Re-throw after max retries
            }
        }
    }//end while
     return { status: 'pending' }; //If while loop ends, transaction was not processed.
}