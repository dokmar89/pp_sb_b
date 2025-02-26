"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabaseAdmin } from "@/lib/supabase/server"

const ticketSchema = z.object({
  subject: z.string().min(5, "Předmět musí mít alespoň 5 znaků"),
  description: z.string().min(20, "Popis musí mít alespoň 20 znaků"),
  priority: z.enum(["low", "medium", "high"]),
})

const messageSchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1, "Zpráva nemůže být prázdná"),
})

export async function createTicket(formData: z.infer<typeof ticketSchema>) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("Unauthorized")
    }

    // Get company ID for the current user
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!company) {
      throw new Error("Company not found")
    }

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        company_id: company.id,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: "open",
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/dashboard/support")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating ticket:", error)
    return { success: false, error: "Došlo k chybě při vytváření ticketu" }
  }
}

export async function addMessage(formData: z.infer<typeof messageSchema>) {
  try {
    const { data, error } = await supabaseAdmin
      .from("support_messages")
      .insert({
        ticket_id: formData.ticketId,
        message: formData.message,
        is_staff: false,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/dashboard/support")
    return { success: true, data }
  } catch (error) {
    console.error("Error adding message:", error)
    return { success: false, error: "Došlo k chybě při odesílání zprávy" }
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  try {
    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId)

    if (error) throw error

    revalidatePath("/dashboard/support")
    return { success: true }
  } catch (error) {
    console.error("Error updating ticket status:", error)
    return { success: false, error: "Došlo k chybě při aktualizaci stavu ticketu" }
  }
}
