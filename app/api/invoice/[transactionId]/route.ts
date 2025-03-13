// app/api/invoice/[transactionId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/actions/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const transactionId = params.transactionId;

    if (!transactionId) {
      return new NextResponse("Chybí ID transakce", { status: 400 });
    }

    const pdfBuffer = await generateInvoicePDF(transactionId);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="faktura-${transactionId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("Chyba při generování faktury:", error);
    return new NextResponse(JSON.stringify({ error: error.message || "Nepodařilo se vygenerovat fakturu" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}