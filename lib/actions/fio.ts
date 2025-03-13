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

async function pockej(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkFioPayments(transactionNumber: string) {
    console.log(`checkFioPayments spuštěno s transactionNumber: ${transactionNumber}`);

    if (!FIO_API_TOKEN) {
        throw new Error("FIO_API_TOKEN není nastaven v proměnných prostředí!");
    }

    const dnes = new Date();
    const odData = format(dnes, "yyyy-MM-dd");
    const doData = format(dnes, "yyyy-MM-dd");

    const url = `https://fioapi.fio.cz/v1/rest/periods/${FIO_API_TOKEN}/${odData}/${doData}/transactions.json`;

    let pocetPokusu = 0;
    const maximalniPokusy = 5;
    let cekaciDoba = 1000;

    while (pocetPokusu < maximalniPokusy) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 409) {
                    pocetPokusu++;
                    console.warn(`Fio API omezuje četnost požadavků (pokus ${pocetPokusu}). Čekám ${cekaciDoba / 1000} sekund...`);
                    await pockej(cekaciDoba);
                    cekaciDoba *= 2;
                    continue;
                }
                throw new Error(`HTTP chyba! Status: ${response.status}, Text: ${await response.text()}`);
            }

            const data = await response.json();

            if (!data.accountStatement?.transactionList?.transaction) {
                console.log("Žádné nové transakce (v aktuálním FIO výpisu).");
                return { status: 'pending' };
            }

            for (const transakce of data.accountStatement.transactionList.transaction) {
                const variabilniSymbol = transakce.column5?.value;
                const castka = transakce.column1?.value;

                console.log('Přijatá FIO transakce:', {
                    VS: variabilniSymbol,
                    částka: castka,
                    typČástky: typeof castka
                });

                if (typeof castka !== 'number') {
                    console.warn("Přeskočení transakce - castka není číslo:", transakce);
                    continue;
                }

                if (!variabilniSymbol) {
                    continue;
                }

                if (String(variabilniSymbol) === transactionNumber) {
                    console.log(`Nalezen VS ${variabilniSymbol} shodující se s hledaným ${transactionNumber}`);

                    try {
                        const { data: naseTransakce, error: chybaHledani } = await supabase
                            .from('wallet_transactions')
                            .select('amount, id, company_id')
                            .eq('transaction_number', transactionNumber)
                            .eq('status', 'pending')
                            .single();

                        if (chybaHledani) {
                            console.error("Chyba při hledání transakce v DB:", chybaHledani);
                            return { status: 'pending' };
                        }

                        if (!naseTransakce) {
                            console.warn("Transakce nebyla nalezena v DB (i když by měla být):", transactionNumber);
                            return { status: 'pending' };
                        }

                        const ocekavanaCastka = naseTransakce.amount;
                        const prijataCastka = Math.round(Math.abs(castka));

                        console.log('Porovnání částek:', {
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
                                return { status: 'pending' };
                            }

                            console.log(`Transakce ${transactionNumber} AKTUALIZOVÁNA.`);
                            return { status: 'completed' };

                        } else {
                            console.warn(`Částky se NESHODUJÍ pro ${transactionNumber}`);
                            return { status: 'pending' };
                        }

                    } catch (error) {
                        console.error("Chyba uvnitř cyklu pro zpracování transakce:", error);
                        return { status: 'pending' };

                    }
                }
            }
            console.log(`Transakce ${transactionNumber} NENALEZENA ve FIO datech.`);
            return { status: 'pending' };

        } catch (error) {
            console.error("Obecná chyba v checkFioPayments:", error);
            if (pocetPokusu >= maximalniPokusy) {
                throw error;
            }
        }
    }
     return { status: 'pending' };
}