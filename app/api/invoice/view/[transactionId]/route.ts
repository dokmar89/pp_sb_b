// app/api/invoice/view/[transactionId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/actions/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    console.log('Načítám transakci:', params.transactionId)

    // Ověříme, že ID je platné UUID nebo číslo
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(params.transactionId) && !/^\d+$/.test(params.transactionId)) {
      console.error('Neplatné ID transakce:', {
        received: params.transactionId,
        type: typeof params.transactionId
      })
      return NextResponse.json(
        { 
          error: 'Neplatné ID transakce',
          message: 'ID transakce musí být platné UUID nebo číslo',
          received: params.transactionId
        },
        { status: 400 }
      )
    }

    // Získáme transakci
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          address,
          ico,
          dic
        )
      `)
      .eq('id', params.transactionId)
      .single()

    if (transactionError || !transaction) {
      console.error('Chyba při načítání transakce:', transactionError)
      throw new Error('Transakce nenalezena')
    }

    console.log('Transakce nalezena:', transaction)

    // Generujeme PDF
    const pdfBuffer = await generateInvoicePDF(params.transactionId)

    // Vracíme PDF pro zobrazení v prohlížeči
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="faktura-${params.transactionId}.pdf"`,
        'Cache-Control': 'no-store' // Zakážeme cache pro PDF
      }
    })

  } catch (error) {
    console.error('Chyba při generování faktury:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nepodařilo se vygenerovat fakturu' },
      { status: 500 }
    )
  }
}
