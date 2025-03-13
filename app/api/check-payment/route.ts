// app/api/check-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkFioPayments } from '@/lib/actions/fio';

export async function POST(request: NextRequest) {
    try {
        const { transactionNumber } = await request.json();

        if (!transactionNumber) {
            return NextResponse.json(
                { error: 'Chybí číslo transakce' },
                { status: 400 }
            );
        }

        const checkResult = await checkFioPayments(transactionNumber);

        if (checkResult.status === 'completed') {
             return NextResponse.json({ status: 'completed' });
        } else if (checkResult.status === 'pending') {
              return NextResponse.json({ status: 'pending' });
        }
        else {
          return NextResponse.json({ status: 'pending' }, {status: 500});
        }


    } catch (error: any) {
        console.error('Chyba v /api/check-payment:', error);
        return NextResponse.json(
            { error: 'Chyba při kontrole platby', details: error.message || "Neznámá chyba" },
            { status: 500 }
        );
    }
}