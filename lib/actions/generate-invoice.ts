import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { supabaseAdmin } from '../supabase/server'

export async function generateInvoicePDF(transactionId: string) {
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('wallet_transactions')
    .select(`
      *,
companies (
        name,
        ico,
        dic,
        street,
        city,
        zip,
        country
      )
    `)
    .eq('id', transactionId)
    .single()
 
    if (transactionError || !transaction) {
      console.error('Chyba při načítání transakce:', transactionError)
      throw new Error('Transakce nenalezena')
    }

const invoiceNumber = transaction.transaction_number;
const company = transaction.companies;
const pdfDoc = await PDFDocument.create()
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
const page = pdfDoc.addPage([595.28, 841.89]) // A4
const { width, height } = page.getSize()

    // PassProve brand barva (tmavě zeleno-modrá)
    const brandColor = rgb(0.0, 0.32, 0.33)  // Přibližný odstín #005253

    // Funkce pro kreslení textu s podporou speciálních znaků
    const drawText = (text: string, x: number, y: number, size: number, bold = false) => {
      const encodedText = text
        .normalize('NFKD') // Normalizace Unicode
        .replace(/[^\x00-\x7F]/g, '') // Odstranění diakritiky
        .replace(/\s+/g, ' ') // Normalizace mezer
      
      page.drawText(encodedText, {
        x,
        y: height - y,
        size,
        font: bold ? boldFont : font,
        color: rgb(0, 0, 0)
      })
    }

    // Záhlaví faktury
    drawText('FAKTURA - Danovy doklad', width / 2 - 80, 80, 20, true)
    drawText(`Cislo faktury (ID transakce): ${invoiceNumber}`, width / 2 - 50, 110, 12)

    // Brand pruh pod záhlavím
    page.drawRectangle({
      x: 40,
      y: height - 130,
      width: width - 80,
      height: 2,
      color: brandColor,
    })

    // Dodavatel box
    drawText('DODAVATEL:', 50, 180, 12, true)
    drawText('NAZEV ZJISTIT KURVA', 50, 200)
    drawText('ADRESA ZJISTIT KURVA ULICE', 50, 220)
    drawText('MĚSTO ZJISTIT KURVA', 50, 240)
    drawText('ICO: ZJISTIT KURVA', 50, 260)
    drawText('DIC: ZJISTIT KURVA', 50, 280)

    // Odběratel box
    drawText('ODBERATEL:', width - 250, 180, 12, true)
    drawText(transaction.companies.name?.replace(/[^\x00-\x7F]/g, "") || '', width - 250, 200)
    drawText(transaction.companies.street?.replace(/[^\x00-\x7F]/g, "") || '', width - 250, 220)
    drawText(`ICO: ${transaction.companies.ico || ''}`, width - 250, 240)
    drawText(`DIC: ${transaction.companies.dic || ''}`, width - 250, 260)

    // Detaily faktury
    const date = new Date().toLocaleDateString('en-GB')
    const dueDate = new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('en-GB')
    
    drawText('Datum vystaveni:', 50, 340, 10, true)
    drawText(date, 150, 340)
    drawText('Datum splatnosti:', 50, 360, 10, true)
    drawText(dueDate, 150, 360)
    drawText('Forma uhrady:', 50, 380, 10, true)
    drawText('Bankovnim prevodem', 150, 380)

    // Tabulka položek
    const tableTop = 450
    const lineHeight = 25
    
    // Záhlaví tabulky
    page.drawRectangle({
      x: 40,
      y: height - tableTop,
      width: width - 80,
      height: 30,
      color: rgb(0.95, 0.95, 0.95),
    })

    drawText('Polozka', 50, tableTop - 20, 10, true)
    drawText('Mnozstvi', 250, tableTop - 20, 10, true)
    drawText('Cena bez DPH', 350, tableTop - 20, 10, true)
    drawText('DPH 21%', 450, tableTop - 20, 10, true)
    drawText('Celkem', width - 90, tableTop - 20, 10, true)

    // Položka - upravený výpočet
    const amount = Math.abs(transaction.amount || 0)
    const baseAmount = amount  // Toto je základní částka (např. 500 Kč)
    const vat = baseAmount * 0.21  // 21% z základní částky (např. 105 Kč)
    const totalAmount = baseAmount + vat  // Celková částka s DPH (např. 605 Kč)

    drawText('PassProve - dobiti kreditu penezenky', 50, tableTop + lineHeight)
    drawText('1', 250, tableTop + lineHeight)
    drawText(`${baseAmount.toFixed(2)} Kc`, 350, tableTop + lineHeight)
    drawText(`${vat.toFixed(2)} Kc`, 450, tableTop + lineHeight)
    drawText(`${totalAmount.toFixed(2)} Kc`, width - 90, tableTop + lineHeight)

    // Součet
    const summaryTop = tableTop + 3 * lineHeight
    page.drawRectangle({
      x: width - 200,
      y: height - summaryTop,
      width: 160,
      height: 80,
      color: rgb(0.95, 0.95, 0.95),
    })

    drawText('Celkem k uhrade:', width - 190, summaryTop + 20, 12, true)
    drawText(`${totalAmount.toFixed(2)} Kc`, width - 190, summaryTop + 45, 14, true)

    // Patička
    const footerTop = height - 100
    page.drawLine({
      start: { x: 40, y: footerTop },
      end: { x: width - 40, y: footerTop },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    drawText('PassProve s.r.o. | www.passprove.cz', width / 2 - 150, 780, 9)
    drawText('Email: fakturace@passprove.cz | Tel: +420 123 456 789', width / 2 - 150, 800, 9)

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)

  } catch (error) {
    console.error('Error generating invoice:', error)
    throw error
  }
  