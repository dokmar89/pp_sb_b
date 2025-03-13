import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Ověříme, že ID je číselné
    if (!/^\d+$/.test(params.transactionId)) {
      throw new Error('Neplatné ID transakce - musí být číselné')
    }

    // Získáme stav transakce
    const { data: transaction, error } = await supabase
      .from('wallet_transactions')
      .select('status')
      .eq('id', params.transactionId)
      .single()

    if (error) {
      throw new Error('Transakce nenalezena')
    }

    return NextResponse.json({ status: transaction.status })

  } catch (error) {
    console.error('Chyba při kontrole stavu transakce:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nepodařilo se zkontrolovat stav transakce' },
      { status: 500 }
    )
  }
} 