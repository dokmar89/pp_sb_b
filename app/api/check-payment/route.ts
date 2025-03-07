// app/api/check-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkFioPayments } from '@/lib/actions/fio';
import { createClient } from '@supabase/supabase-js'; // Import createClient

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

export async function POST(request: NextRequest) {
    try {
        const { transactionNumber } = await request.json();

        if (!transactionNumber) {
            return NextResponse.json(
                { error: 'Chybí číslo transakce' },
                { status: 400 } // 400 Bad Request for missing input
            );
        }

        // 1. Check if the transaction exists *and* is pending in Supabase *first*
        const { data: transaction, error: transactionError } = await supabase
            .from('wallet_transactions')
            .select('id, status, company_id, amount, transaction_number') // Select relevant columns
            .eq('transaction_number', transactionNumber)
            .eq('status', 'pending') // Only check pending transactions!
            .single();

        if (transactionError) {
            console.error("Chyba při hledání transakce v route.ts:", transactionError); // Detailnější log
            return NextResponse.json(
                { error: "Chyba při ověřování transakce" }, // Generic error
                { status: 500 } // 500 Internal Server Error for DB errors
            );
        }

        if (!transaction) {
            console.log(`Transakce ${transactionNumber} nenalezena nebo není ve stavu pending.`); // Logování
            return NextResponse.json(
                { error: 'Transakce nenalezena nebo již byla zpracována' },
                { status: 404 } // 404 Not Found if not pending or doesn't exist
            );
        }

        console.log(`Volám checkFioPayments pro transakci ${transactionNumber}, ID: ${transaction.id}, částka: ${transaction.amount}`); // Důležité logování!

        const checkResult = await checkFioPayments(transactionNumber);

        console.log(`checkFioPayments vrátilo:`, checkResult); // Logování výsledku!

        if (checkResult.status === 'completed') {
             return NextResponse.json({ status: 'completed' });
        } else if (checkResult.status === 'pending') {
              return NextResponse.json({ status: 'pending' });
        }
        else {
          //Should not happen, but handle just in case.
          return NextResponse.json({ status: 'pending' }, {status: 500});
        }


    } catch (error: any) {
        console.error('Chyba v /api/check-payment:', error); // Detailní logování chyby
        return NextResponse.json(
            { error: 'Chyba při kontrole platby', details: error.message || "Neznámá chyba" },
            { status: 500 }
        );
    }
}