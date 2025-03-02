"use server"

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

interface InvoiceData {
  invoiceNumber: string
  companyName: string
  companyAddress: string
  companyIco: string
  companyDic: string
  amount: number
  date: Date
}

export async function generateInvoicePDF(transactionId: string): Promise<Buffer> {
  const supabase = createServerComponentClient({ cookies })

  // Získání dat transakce a spolecnosti
  const { data: transaction } = await supabase
    .from("wallet_transactions")
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
    .eq("id", transactionId)
    .single()

  if (!transaction) {
    throw new Error("Transakce nenalezena")
  }

  // Zkusíme najít fakturační údaje v billing_info tabulce
  const { data: billingInfo } = await supabase
    .from("billing_info")
    .select("*")
    .eq("company_id", transaction.companies?.id)
    .single()

  // Použijeme fakturační údaje, pokud existují, jinak použijeme údaje společnosti
  const invoiceData: InvoiceData = {
    invoiceNumber: transaction.invoice_number || `INV-${transactionId.substring(0, 8)}`,
    companyName: billingInfo?.name || transaction.companies?.name || "Neznáma spolecnost",
    companyAddress: billingInfo?.address || transaction.companies?.address || "Adresa neuvedena",
    companyIco: billingInfo?.ico || transaction.companies?.ico || "IcO neuvedeno",
    companyDic: billingInfo?.dic || transaction.companies?.dic || "DIc neuvedeno",
    amount: Math.abs(transaction.amount || 0),
    date: new Date(transaction.created_at),
  }

  // Vytvoření PDF dokumentu pomocí pdf-lib
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  
  // Pomocné funkce pro kreslení textu
  const drawText = (text: string, x: number, y: number, size = 12, isBold = false, align = 'left') => {
    const font = isBold ? timesRomanBoldFont : timesRomanFont
    const textWidth = font.widthOfTextAtSize(text, size)
    let xPos = x
    
    if (align === 'center') {
      xPos = x - textWidth / 2
    } else if (align === 'right') {
      xPos = x - textWidth
    }
    
    page.drawText(text, {
      x: xPos,
      y: height - y,
      size,
      font
    })
  }
  
  // Hlavicka faktury
  drawText('FAKTURA', width / 2, 50, 24, true, 'center')
  drawText(`císlo faktury: ${invoiceData.invoiceNumber}`, 50, 100, 12)
  drawText(`Datum vystaveni: ${invoiceData.date.toLocaleDateString("cs-CZ")}`, 50, 120, 12)
  
  // Dodavatel
  drawText('Dodavatel:', 50, 160, 14, true)
  drawText('PassProve s.r.o.', 50, 180, 12)
  drawText('Príkladová 123', 50, 200, 12)
  drawText('110 00 Praha 1', 50, 220, 12)
  drawText('IcO: 12345678', 50, 240, 12)
  drawText('DIc: CZ12345678', 50, 260, 12)
  
  // Odběratel
  drawText('Odberatel:', 300, 160, 14, true)
  drawText(invoiceData.companyName, 300, 180, 12)
  drawText(invoiceData.companyAddress, 300, 200, 12)
  drawText(`IcO: ${invoiceData.companyIco}`, 300, 220, 12)
  drawText(`DIc: ${invoiceData.companyDic}`, 300, 240, 12)
  
  // Položky faktury
  drawText('Polozky:', 50, 320, 14, true)
  
  // Hlavicka tabulky
  page.drawRectangle({
    x: 50,
    y: height - 350,
    width: width - 100,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  })
  
  drawText('Položka', 60, 365, 12, true)
  drawText('Množství', 200, 365, 12, true)
  drawText('Cena bez DPH', 300, 365, 12, true)
  drawText('Celkem bez DPH', 420, 365, 12, true)
  
  // Položka
  drawText('Dobití kreditu', 60, 395, 12)
  drawText('1', 200, 395, 12)
  drawText(`${invoiceData.amount.toFixed(2)} Kc`, 300, 395, 12)
  drawText(`${invoiceData.amount.toFixed(2)} Kc`, 420, 395, 12)
  
  // Soucty
  const dph = invoiceData.amount * 0.21
  const total = invoiceData.amount + dph
  
  drawText(`Základ DPH: ${invoiceData.amount.toFixed(2)} Kc`, width - 50, 450, 12, false, 'right')
  drawText(`DPH 21%: ${dph.toFixed(2)} Kc`, width - 50, 470, 12, false, 'right')
  drawText(`Celkem s DPH: ${total.toFixed(2)} Kc`, width - 50, 490, 12, true, 'right')
  
  // Paticka
  drawText('Faktura byla vystavena elektronicky a je platná bez podpisu a razítka.', width / 2, 550, 10, false, 'center')
  
  // Finalizace dokumentu
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
