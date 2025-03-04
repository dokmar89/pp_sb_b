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

  // Získání dat transakce a společnosti
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

    // Použijeme ID transakce jako číslo faktury (je už číselné)
  const invoiceNumber = transaction.invoice_number || transaction.id;
  
  const invoiceData: InvoiceData = {
    invoiceNumber,
    companyName: billingInfo?.name || transaction.companies?.name || "Neznáma společnost",
    companyAddress: billingInfo?.address || transaction.companies?.address || "Adresa neuvedena",
    companyIco: billingInfo?.ico || transaction.companies?.ico || "IČO neuvedeno",
    companyDic: billingInfo?.dic || transaction.companies?.dic || "DIČ neuvedeno",
    amount: Math.abs(transaction.amount || 0),
    date: new Date(transaction.created_at),
  }

  // Vytvoření PDF dokumentu pomocí pdf-lib
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  
  // Pomocná funkce pro kreslení textu
  const drawText = (text: string, x: number, y: number, size = 12, isBold = false, align: "left" | "center" | "right" = "left") => {
    const font = isBold ? timesRomanBoldFont : timesRomanFont
    
    // Normalizace textu pro PDF
    const normalizedText = text
      .normalize('NFKD') // Normalizace Unicode
      .replace(/[^\x00-\x7F]/g, '') // Odstranění diakritiky
      .replace(/\s+/g, ' ') // Normalizace mezer
    
    const textWidth = font.widthOfTextAtSize(normalizedText, size)
    let xPos = x
    if (align === "center") {
      xPos = x - textWidth / 2
    } else if (align === "right") {
      xPos = x - textWidth
    }
    page.drawText(normalizedText, {
      x: xPos,
      y: height - y,
      size,
      font
    })
  }
  
  // Hlavička faktury
  drawText('FAKTURA - DAŇOVÝ DOKLAD', width / 2, 50, 24, true, 'center')
  drawText(`Číslo faktury: ${invoiceData.invoiceNumber}`, 50, 100, 12)
  drawText(`Datum vystavení: ${invoiceData.date.toLocaleDateString("cs-CZ")}`, 50, 120, 12)
  
  // Dodavatel
  drawText('Dodavatel:', 50, 160, 14, true)
  drawText('PassProve s.r.o.', 50, 180, 12)
  drawText('Příkladová 123', 50, 200, 12)
  drawText('110 00 Praha 1', 50, 220, 12)
  drawText('IČO: 12345678', 50, 240, 12)
  drawText('DIČ: CZ12345678', 50, 260, 12)
  
  // Odběratel
  drawText('Odběratel:', 300, 160, 14, true)
  drawText(invoiceData.companyName, 300, 180, 12)
  drawText(invoiceData.companyAddress, 300, 200, 12)
  drawText(`IČO: ${invoiceData.companyIco}`, 300, 220, 12)
  drawText(`DIČ: ${invoiceData.companyDic}`, 300, 240, 12)
  
  // Položky faktury
  drawText('Položky:', 50, 320, 14, true)
  
  // Hlavička tabulky
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
  drawText('DPH 21%', 400, 365, 12, true)
  drawText('Celkem s DPH', 500, 365, 12, true)
  
  // Fakturační položka
  const dph = invoiceData.amount * 0.21
  const total = invoiceData.amount + dph

  drawText('Dobití kreditu', 60, 395, 12)
  drawText('1', 200, 395, 12)
  drawText(`${invoiceData.amount.toFixed(2)} Kč`, 300, 395, 12)
  drawText(`${dph.toFixed(2)} Kč`, 400, 395, 12)
  drawText(`${total.toFixed(2)} Kč`, 500, 395, 12)
  
  // Součty
  drawText('Rekapitulace:', 50, 450, 14, true)
  drawText(`Základ DPH: ${invoiceData.amount.toFixed(2)} Kč`, width - 50, 480, 12, false, 'right')
  drawText(`DPH 21%: ${dph.toFixed(2)} Kč`, width - 50, 500, 12, false, 'right')
  drawText(`Celkem k úhradě: ${total.toFixed(2)} Kč`, width - 50, 520, 14, true, 'right')
  
  // Platební údaje
  drawText('Platební údaje:', 50, 580, 14, true)
  drawText('Číslo účtu: 2702945534/2010', 50, 600, 12)
  drawText(`Variabilní symbol: ${invoiceData.invoiceNumber}`, 50, 620, 12)
  drawText(`Částka k úhradě: ${total.toFixed(2)} Kč`, 50, 640, 12)
  
  // QR kód pro platbu můžete přidat zde, pokud je potřeba
  
  // Patička
  drawText('Faktura byla vystavena elektronicky a je platná bez podpisu a razítka.', width / 2, height - 50, 10, false, 'center')
  
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}