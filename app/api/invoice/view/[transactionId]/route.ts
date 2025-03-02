// app/api/invoice/view/[transactionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/actions/invoice'
import { ShopsList } from '@/components/shops/shops-list';
import { AddShopDialog } from '@/components/add-shop-dialog';

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    console.log('Viewing invoice for transaction:', params.transactionId)

    // Generujeme PDF pomocí správné funkce
    const pdfBuffer = await generateInvoicePDF(params.transactionId)

    // Vracíme PDF pro zobrazení (nikoliv stažení)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // Inline místo attachment způsobí, že prohlížeč PDF zobrazí místo stažení
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

export default function EshopPage() {
    return (
        <div>
            <h1>Manage E-shops</h1>
            <AddShopDialog />
            <ShopsList />
        </div>
    );
}
