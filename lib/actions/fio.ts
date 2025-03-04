import { format } from 'date-fns'
import { createClient } from '@supabase/supabase-js'

const FIO_API_TOKEN = process.env.FIO_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Chybí Supabase konfigurace');
}

// Vytvoříme klienta s service_role klíčem
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function checkFioPayments(specificTransaction?: string) {
  if (!FIO_API_TOKEN) {
    console.error("FIO_API_TOKEN není nastaven v proměnných prostředí!");
    return;
  }

  const today = new Date();
  const fromDate = format(today, "yyyy-MM-dd");
  const toDate = format(today, "yyyy-MM-dd");

  const url = `https://fioapi.fio.cz/v1/rest/periods/${FIO_API_TOKEN}/${fromDate}/${toDate}/transactions.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.accountStatement?.transactionList?.transaction) {
      console.log("Žádné nové transakce.");
      return;
    }

    for (const transaction of data.accountStatement.transactionList.transaction) {
      const variableSymbol = transaction.column5?.value;
      const amount = transaction.column1?.value;

      console.log('Přijatá FIO transakce:', {
        VS: variableSymbol,
        částka: amount,
        typČástky: typeof amount
      });

      if (!variableSymbol || !amount) continue;

      try {
        const { data: ourTransaction, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('transaction_number', variableSymbol)
          .eq('status', 'pending')
          .single();

        if (error) {
          console.error("Chyba při hledání transakce:", error);
          continue;
        }

        if (ourTransaction) {
          // Zjednodušená kontrola - přímé porovnání částek
          const expectedAmount = ourTransaction.amount;
          const receivedAmount = Math.round(Math.abs(Number(amount)));

          console.log('Porovnání částek:', {
            očekáváno: expectedAmount,
            přijato: receivedAmount,
            původníČástka: amount,
            poZaokrouhlení: receivedAmount
          });

          if (expectedAmount === receivedAmount) {
            console.log('Částky se shodují, aktualizuji transakci');
            const { error: updateError } = await supabase
              .from('wallet_transactions')
              .update({ 
                status: 'completed',
                // Použijeme pouze status, dokud nebude sloupec paid_at přidán
                // paid_at: new Date().toISOString() 
              })
              .eq('id', ourTransaction.id);

            if (updateError) {
              console.error("Chyba při aktualizaci transakce:", updateError);
            } else {
              console.log(`Transakce ${ourTransaction.transaction_number} byla úspěšně spárována.`);
              
              // Aktualizace kreditu
              const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('credit')
                .eq('id', ourTransaction.company_id)
                .single();

              if (!companyError && company) {
                const newCredit = (company.credit || 0) + expectedAmount;
                await supabase
                  .from('companies')
                  .update({ credit: newCredit })
                  .eq('id', ourTransaction.company_id);
              }
            }
          } else {
            console.log(`Nesouhlasí částka pro transakci ${ourTransaction.transaction_number}:`, {
              očekáváno: expectedAmount,
              přijato: receivedAmount
            });
          }
        }
      } catch (error) {
        console.error("Chyba při zpracování transakce:", error);
      }
    }
  } catch (error) {
    console.error("Chyba při kontrole Fio plateb:", error);
  }
}
