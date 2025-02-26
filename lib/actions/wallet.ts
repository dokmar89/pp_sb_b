"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabaseAdmin } from "@/lib/supabase/server"

const topUpSchema = z.object({
  companyId: z.string().uuid(),
  amount: z.number().positive(),
})

export async function createTopUpTransaction(formData: z.infer<typeof topUpSchema>) {
  try {
    const { data, error } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        company_id: formData.companyId,
        type: "credit",
        amount: formData.amount,
        description: "Dobití kreditu",
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/dashboard")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating top-up transaction:", error)
    return { success: false, error: "Došlo k chybě při vytváření transakce" }
  }
}

export async function checkTopUpStatus(transactionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("wallet_transactions")
      .select("status")
      .eq("id", transactionId)
      .single()

    if (error) throw error

    return { success: true, status: data.status }
  } catch (error) {
    console.error("Error checking transaction status:", error)
    return { success: false, error: "Došlo k chybě při kontrole stavu transakce" }
  }
}

export async function getWalletBalance(companyId: string) {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from("wallet_transactions")
      .select("type, amount, status")
      .eq("company_id", companyId)
      .eq("status", "completed")

    if (error) throw error

    const balance = transactions.reduce((acc, transaction) => {
      if (transaction.type === "credit") {
        return acc + transaction.amount
      } else {
        return acc - transaction.amount
      }
    }, 0)

    return { success: true, balance }
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return { success: false, error: "Došlo k chybě při získávání zůstatku" }
  }
}

