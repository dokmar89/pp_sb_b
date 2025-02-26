import { createWorker } from "tesseract.js"

export async function processIdCard(imageData: string | Blob): Promise<{
  success: boolean
  birthDate?: Date
  age?: number
  error?: string
}> {
  try {
    // Vytvoření Tesseract workera
    const worker = await createWorker("ces") // Czech language

    // Nastavení parametrů pro OCR
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789.",
    })

    // Převod obrazu na text
    const {
      data: { text },
    } = await worker.recognize(imageData)

    // Ukončení workera
    await worker.terminate()

    // Hledání data narození v textu
    const birthDate = extractBirthDate(text)

    if (!birthDate) {
      return {
        success: false,
        error: "Nepodařilo se najít datum narození na dokladu",
      }
    }

    // Výpočet věku
    const age = calculateAge(birthDate)

    return {
      success: true,
      birthDate,
      age,
    }
  } catch (error) {
    console.error("OCR Error:", error)
    return {
      success: false,
      error: "Došlo k chybě při zpracování dokladu",
    }
  }
}

function extractBirthDate(text: string): Date | null {
  // Regulární výrazy pro různé formáty data narození
  const patterns = [
    /\b\d{2}\.\d{2}\.\d{4}\b/, // DD.MM.YYYY
    /\b\d{6}\/\d{3,4}\b/, // Rodné číslo formát YYMMDD/XXXX
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[0]

      // Zpracování rodného čísla
      if (dateStr.includes("/")) {
        const birthPart = dateStr.split("/")[0]
        const year = Number.parseInt(birthPart.substring(0, 2))
        const month = Number.parseInt(birthPart.substring(2, 4))
        const day = Number.parseInt(birthPart.substring(4, 6))

        // Úprava roku (19xx nebo 20xx)
        const fullYear = year < 54 ? 2000 + year : 1900 + year

        // Úprava měsíce (u žen je měsíc +50)
        const realMonth = month > 50 ? month - 50 : month

        return new Date(fullYear, realMonth - 1, day)
      }

      // Zpracování běžného formátu data
      const [day, month, year] = dateStr.split(".").map(Number)
      return new Date(year, month - 1, day)
    }
  }

  return null
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

