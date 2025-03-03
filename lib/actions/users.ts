"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"
import { sendInvitationEmail } from "@/lib/email"

interface CreateUserParams {
  companyId: string
  firstName: string
  lastName: string
  position: string
  email: string
}

export async function createCompanyUser(params: CreateUserParams) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Kontrola, zda uživatel má oprávnění vytvářet uživatele
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: "Uživatel není přihlášen" }
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || !user) {
      return { success: false, error: "Uživatel nenalezen" }
    }

    if (user.role !== "owner") {
      return { success: false, error: "Nemáte oprávnění vytvářet uživatele" }
    }

    // Kontrola, zda email již neexistuje
    const { data: existingUser, error: checkError } = await supabase
      .from("company_users")
      .select("id")
      .eq("email", params.email)
      .single()

    if (existingUser) {
      return { success: false, error: "Uživatel s tímto emailem již existuje" }
    }

    // Vytvoření pozvánkového tokenu
    const invitationToken = uuidv4()

    // Vytvoření uživatele
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("company_users")
      .insert({
        companyId: params.companyId,
        first_name: params.firstName,
        last_name: params.lastName,
        position: params.position,
        email: params.email,
        role: "member", // Omezená práva
        status: "pending",
        invitation_token: invitationToken
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating user:", createError)
      return { success: false, error: "Nepodařilo se vytvořit uživatele" }
    }

    // Získání názvu společnosti pro email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", params.companyId)
      .single()

    // Odeslání pozvánkového emailu
    const emailResult = await sendInvitationEmail({
      email: params.email,
      firstName: params.firstName,
      invitationToken,
      companyName: company?.name || "Vaše společnost"
    })

    if (!emailResult.success) {
      return {
        success: true,
        warning: "Uživatel byl vytvořen, ale nepodařilo se odeslat pozvánkový email"
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in createCompanyUser:", error)
    return { success: false, error: "Došlo k neočekávané chybě" }
  }
}

export async function getCompanyUsers(companyId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase
      .from("company_users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        position,
        status,
        created_at
      `)
      .eq("companyId", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching company users:", error)
      return { success: false, error: "Nepodařilo se načíst uživatele" }
    }

    const users = data.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      position: user.position,
      status: user.status,
      createdAt: user.created_at
    }))

    return { success: true, users }
  } catch (error) {
    console.error("Error in getCompanyUsers:", error)
    return { success: false, error: "Došlo k neočekávané chybě" }
  }
}

export async function isCompanyOwner(userId: string, companyId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .eq("companyId", companyId)
      .single()

    if (error || !data) {
      return false
    }

    return data.role === "owner"
  } catch (error) {
    return false
  }
}