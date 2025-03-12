import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const VERIFICATION_PRICES = {
  bankid: 20,
  mojeid: 15,
  ocr: 10,
  facescan: 5,
  revalidate: 2
} as const

export async function checkCredit(companyId: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Načtení zůstatku z databáze
  const { data: company, error } = await supabase
    .from("companies")
    .select("walletBalance")
    .eq("id", companyId)
    .single()
    
  if (error || !company) {
    throw new Error("Nepodařilo se načíst informace o společnosti")
  }

  // Vrátíme informace o kreditu
  return {
    hasCredit: company.walletBalance > 0,
    creditsLeft: company.walletBalance
  }
} 