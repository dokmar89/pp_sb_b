// lib/actions/credit.ts
"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Vytvoření Supabase klienta pro serverové akce
const supabase = createServerActionClient({ cookies })

/**
 * Kontroluje, zda má společnost dostatek kreditu pro provedení verifikace
 * @param companyId ID společnosti
 * @returns Objekt s informací, zda má společnost kredit a kolik kreditu zbývá
 */
export async function checkCredit(companyId: string) {
  try {
    // 1. Získat všechny transakce společnosti
    const { data: transactions, error: transactionsError } = await supabase
      .from("wallet_transactions")
      .select("type, amount, status")
      .eq("company_id", companyId)
      .eq("status", "completed")

    if (transactionsError) throw transactionsError

    // 2. Vypočítat zůstatek na účtu
    const balance = transactions.reduce((acc, transaction) => {
      if (transaction.type === "credit") {
        return acc + transaction.amount
      } else {
        return acc - transaction.amount
      }
    }, 0)

    // 3. Získat počet nevyúčtovaných verifikací
    const { data: pendingVerifications, error: pendingError } = await supabase
      .from("verifications")
      .select("price")
      .eq("company_id", companyId)
      .eq("status", "pending")

    if (pendingError) throw pendingError

    // 4. Vypočítat rezervovaný kredit
    const reservedCredit = pendingVerifications.reduce((acc, verification) => {
      return acc + (verification.price || 0)
    }, 0)

    // 5. Vypočítat dostupný kredit
    const availableCredit = balance - reservedCredit

    // 6. Vrátit výsledek
    return {
      hasCredit: availableCredit > 0,
      creditsLeft: availableCredit,
      totalCredits: balance,
      reservedCredits: reservedCredit
    }
  } catch (error) {
    console.error("Error checking credit:", error)
    // V případě chyby vrátíme, že kredit je k dispozici, aby nedošlo k blokování verifikací
    return { hasCredit: true, creditsLeft: 999, totalCredits: 999, reservedCredits: 0 }
  }
}

/**
 * Vytvoří transakci pro stržení kreditu za verifikaci
 * @param companyId ID společnosti
 * @param verificationId ID verifikace
 * @param amount Částka k odečtení
 */
export async function deductCredit(companyId: string, verificationId: string, amount: number) {
  try {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .insert({
        company_id: companyId,
        type: "debit",
        amount,
        description: `Verifikace ID: ${verificationId}`,
        status: "completed",
        verification_id: verificationId
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error deducting credit:", error)
    return { success: false, error: "Došlo k chybě při odečítání kreditu" }
  }
}