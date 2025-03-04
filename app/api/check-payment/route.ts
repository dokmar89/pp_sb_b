import { NextRequest, NextResponse } from 'next/server'
import { checkFioPayments } from '@/lib/actions/fio'

export async function POST(request: NextRequest) {
  try {
    const { transactionNumber } = await request.json()

    if (!transactionNumber) {
      return NextResponse.json(
        { error: 'Chybí číslo transakce' },
        { status: 400 }
      )
    }

    // Zavoláme kontrolu FIO plateb
    await checkFioPayments()

    // Zkontrolujeme stav transakce
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/wallet_transactions?transaction_number=eq.${transactionNumber}&select=status`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      },
    })

    const [transaction] = await response.json()

    return NextResponse.json({ status: transaction?.status || 'pending' })
  } catch (error) {
    console.error('Chyba při kontrole platby:', error)
    return NextResponse.json(
      { error: 'Chyba při kontrole platby' },
      { status: 500 }
    )
  }
} 