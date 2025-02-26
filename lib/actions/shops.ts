"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import crypto from "crypto"

import { supabaseAdmin } from "@/lib/supabase/server"

const shopSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  sector: z.string(),
  verificationMethods: z.array(z.string()),
  integrationType: z.string(),
  pricingPlan: z.string(),
})

export async function createShop(formData: z.infer<typeof shopSchema>) {
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

    const apiKey = `sk_${crypto.randomBytes(24).toString("hex")}`

    const { data, error } = await supabaseAdmin
      .from("shops")
      .insert({
        name: formData.name,
        url: formData.url,
        sector: formData.sector,
        verification_methods: formData.verificationMethods,
        integration_type: formData.integrationType,
        pricing_plan: formData.pricingPlan,
        company_id: company.id,
        api_key: apiKey,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    // Create default customization
    await supabaseAdmin.from("customizations").insert({
      shop_id: data.id,
      primary_color: "#000000",
      secondary_color: "#ffffff",
      font: "inter",
      button_style: "rounded",
      verification_methods: formData.verificationMethods,
      failure_action: "block",
    })

    revalidatePath("/dashboard/shops")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating shop:", error)
    return { success: false, error: "Došlo k chybě při vytváření eshopu" }
  }
}

export async function updateShopStatus(shopId: string, status: "active" | "inactive") {
  try {
    const { error } = await supabaseAdmin
      .from("shops")
      .update({ status })
      .eq("id", shopId)

    if (error) throw error

    revalidatePath("/dashboard/shops")
    return { success: true }
  } catch (error) {
    console.error("Error updating shop status:", error)
    return { success: false, error: "Došlo k chybě při aktualizaci stavu eshopu" }
  }
}
