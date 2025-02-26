"use server"

import PDFDocument from "pdfkit"
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

  const invoiceData: InvoiceData = {
    invoiceNumber: transaction.invoice_number,
    companyName: transaction.companies.name,
    companyAddress: transaction.companies.address,
    companyIco: transaction.companies.ico,
    companyDic: transaction.companies.dic,
    amount: transaction.amount,
    date: new Date(transaction.created_at),
  }

  // Vytvoření PDF dokumentu
  const doc = new PDFDocument({ size: "A4", margin: 50 })
  const chunks: Buffer[] = []

  doc.on("data", (chunk) => chunks.push(chunk))

  // Hlavička faktury
  doc.font("Helvetica-Bold").fontSize(20).text("FAKTURA", { align: "center" }).moveDown()

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(`Číslo faktury: ${invoiceData.invoiceNumber}`)
    .text(`Datum vystavení: ${invoiceData.date.toLocaleDateString("cs-CZ")}`)
    .moveDown()

  // Dodavatel
  doc
    .font("Helvetica-Bold")
    .text("Dodavatel:")
    .font("Helvetica")
    .text("Věková verifikace s.r.o.")
    .text("Příkladová 123")
    .text("110 00 Praha 1")
    .text("IČO: 12345678")
    .text("DIČ: CZ12345678")
    .moveDown()

  // Odběratel
  doc
    .font("Helvetica-Bold")
    .text("Odběratel:")
    .font("Helvetica")
    .text(invoiceData.companyName)
    .text(invoiceData.companyAddress)
    .text(`IČO: ${invoiceData.companyIco}`)
    .text(`DIČ: ${invoiceData.companyDic}`)
    .moveDown()

  // Položky faktury
  doc.font("Helvetica-Bold").text("Položky:").moveDown()

  const items = [["Dobití kreditu", "1", `${invoiceData.amount.toFixed(2)} Kč`, `${invoiceData.amount.toFixed(2)} Kč`]]

  const tableTop = doc.y
  const tableHeaders = ["Položka", "Množství", "Cena bez DPH", "Celkem bez DPH"]
  const columnWidth = (doc.page.width - 100) / tableHeaders.length

  // Hlavička tabulky
  tableHeaders.forEach((header, i) => {
    doc.font("Helvetica-Bold").text(header, 50 + i * columnWidth, tableTop, { width: columnWidth, align: "left" })
  })

  // Položky tabulky
  items.forEach((row, i) => {
    const rowTop = tableTop + 25 + i * 25
    row.forEach((cell, j) => {
      doc.font("Helvetica").text(cell, 50 + j * columnWidth, rowTop, { width: columnWidth, align: "left" })
    })
  })

  doc.moveDown(2)

  // Součty
  const dph = invoiceData.amount * 0.21
  const total = invoiceData.amount + dph

  doc
    .font("Helvetica-Bold")
    .text(`Základ DPH: ${invoiceData.amount.toFixed(2)} Kč`, { align: "right" })
    .text(`DPH 21%: ${dph.toFixed(2)} Kč`, { align: "right" })
    .text(`Celkem s DPH: ${total.toFixed(2)} Kč`, { align: "right" })

  // Patička
  doc
    .moveDown(2)
    .font("Helvetica")
    .fontSize(10)
    .text("Faktura byla vystavena elektronicky a je platná bez podpisu a razítka.", { align: "center" })

  // Finalizace dokumentu
  doc.end()

  return Buffer.concat(chunks)
}

