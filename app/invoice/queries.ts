import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = "force-dynamic";
export async function getInvoice(transactionId: number) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (invoiceError || !invoice) {
    console.error('Chyba při načítání faktury:', invoiceError)
    throw new Error('Faktura nenalezena')
  }

  return invoice
} 