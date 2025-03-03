// app/api/invoice/view/[transactionId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/actions/invoice'
import { ShopsList } from '@/components/shops-list';
import { AddShopDialog } from '@/components/add-shop-dialog';

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    console.log('Fetching transaction:', params.transactionId)

    // Získáme transakci
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', params.transactionId)
      .single()

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      throw new Error('Transakce nenalezena')
    }

    console.log('Transaction found:', transaction)

    // Získáme společnost
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', transaction.company_id)
      .single()

    if (companyError) {
      console.error('Company error:', companyError)
      throw new Error('Společnost nenalezena')
    }

    console.log('Company found:', company)

    // Generujeme PDF pomocí správné funkce
    const pdfBuffer = await generateInvoicePDF(params.transactionId)

    // Vracíme PDF pro zobrazení v prohlížeči (inline)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="faktura-${params.transactionId}.pdf"`
      }
    })

  } catch (error) {
    console.error('Route handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nepodařilo se vygenerovat fakturu' },
      { status: 500 }
    )
  }
}
