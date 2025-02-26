"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabaseAdmin } from "@/lib/supabase/server"

const registrationSchema = z.object({
  companyName: z.string().min(2),
  ico: z.string().length(8),
  dic: z.string().min(10).max(12),
  address: z.string().min(5),
  email: z.string().email(),
  phone: z.string().min(9),
  contactPerson: z.string().min(3),
  terms: z.boolean(),
  password: z.string().min(6),
})

type RegistrationInput = z.infer<typeof registrationSchema>

export async function registerCompany(formData: RegistrationInput) {
  try {
    // Validate input data
    const validatedData = registrationSchema.parse(formData)

    // Check if company with same ICO or DIC already exists
    const { data: existingCompany, error: checkError } = await supabaseAdmin
      .from("companies")
      .select("id, ico, dic, email")
      .or(`ico.eq.${validatedData.ico},dic.eq.${validatedData.dic},email.eq.${validatedData.email}`)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing company:", checkError)
      return {
        success: false,
        error: "Došlo k chybě při ověřování údajů",
      }
    }

    if (existingCompany) {
      let errorMessage = "Společnost s tímto "
      if (existingCompany.ico === validatedData.ico) errorMessage += "IČO"
      else if (existingCompany.dic === validatedData.dic) errorMessage += "DIČ"
      else errorMessage += "emailem"
      errorMessage += " již existuje"

      return {
        success: false,
        error: errorMessage,
      }
    }

    // First create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return {
        success: false,
        error: "Došlo k chybě při vytváření účtu",
      }
    }

    // Insert new company with auth user id
    const { data: newCompany, error: insertError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: validatedData.companyName,
        ico: validatedData.ico,
        dic: validatedData.dic,
        address: validatedData.address,
        email: validatedData.email,
        phone: validatedData.phone,
        contact_person: validatedData.contactPerson,
        status: "pending",
        user_id: authData.user.id, // Link company to auth user
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting company:", insertError)
      // Delete auth user if company creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: "Došlo k chybě při vytváření společnosti",
      }
    }

    // Create initial wallet transaction with 100 Kč bonus
    const { error: walletError } = await supabaseAdmin.from("wallet_transactions").insert({
      company_id: newCompany.id,
      type: "credit",
      amount: 100,
      description: "Počáteční bonus",
      status: "completed",
    })

    if (walletError) {
      console.error("Error creating wallet transaction:", walletError)
      // Don't return error here as the company was created successfully
    }

    revalidatePath("/")
    return {
      success: true,
      data: newCompany,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Neplatná data formuláře",
      }
    }

    console.error("Error registering company:", error)
    return {
      success: false,
      error: "Došlo k neočekávané chybě při registraci",
    }
  }
}

