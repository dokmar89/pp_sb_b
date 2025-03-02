"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import crypto from "crypto"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

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

export async function updateShopStatus(shopId: string, status: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Ověření, že uživatel má přístup k tomuto eshopu
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Uživatel není přihlášen" }
    }
    
    // Získání company_id uživatele
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single()
      
    if (!company) {
      return { success: false, error: "Uživatel nemá přiřazenou společnost" }
    }
    
    // Ověření, že eshop patří této společnosti
    const { data: shop } = await supabase
      .from("shops")
      .select("company_id")
      .eq("id", shopId)
      .single()
      
    if (!shop || shop.company_id !== company.id) {
      return { success: false, error: "Nemáte oprávnění upravovat tento eshop" }
    }
    
    // Aktualizace statusu eshopu
    const { error } = await supabase
      .from("shops")
      .update({ status })
      .eq("id", shopId)
      
    if (error) {
      console.error("Error updating shop status:", error)
      return { success: false, error: "Nepodařilo se aktualizovat status eshopu" }
    }
    
    revalidatePath("/dashboard/shops")
    return { success: true }
  } catch (error) {
    console.error("Error in updateShopStatus:", error)
    return { success: false, error: "Došlo k neočekávané chybě" }
  }
}

export async function getShopDetails(shopId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Ověření, že uživatel má přístup k tomuto eshopu
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Uživatel není přihlášen" }
    }
    
    // Získání company_id uživatele
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single()
      
    if (!company) {
      return { success: false, error: "Uživatel nemá přiřazenou společnost" }
    }
    
    // Získání detailů eshopu
    const { data: shop, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .eq("company_id", company.id)
      .single()
      
    if (error) {
      console.error("Error fetching shop details:", error)
      return { success: false, error: "Nepodařilo se načíst detaily eshopu" }
    }
    
    if (!shop) {
      return { success: false, error: "Eshop nebyl nalezen" }
    }
    
    // Získání počtu verifikací
    const { data: verifications, error: verificationsError } = await supabase
      .from("verifications")
      .select("count")
      .eq("shop_id", shopId)
      .single()
    
    // Získání statistik verifikací
    // Toto je zjednodušená verze - v reálné aplikaci byste měli mít tabulku se statistikami
    const { data: successfulVerifications, error: successError } = await supabase
      .from("verifications")
      .select("count")
      .eq("shop_id", shopId)
      .eq("status", "success")
      .single()
    
    const { data: failedVerifications, error: failedError } = await supabase
      .from("verifications")
      .select("count")
      .eq("shop_id", shopId)
      .eq("status", "failed")
      .single()
    
    // Sestavení objektu se statistikami
    const stats = {
      total_verifications: verifications?.count || 0,
      successful_verifications: successfulVerifications?.count || 0,
      failed_verifications: failedVerifications?.count || 0,
      average_time: 1500 // Průměrný čas v ms - v reálné aplikaci byste to počítali z dat
    }
    
    return { 
      success: true, 
      shop: {
        id: shop.id,
        name: shop.name,
        url: shop.url,
        apiKey: shop.api_key,
        status: shop.status,
        createdAt: shop.created_at,
        stats
      } 
    }
  } catch (error) {
    console.error("Error in getShopDetails:", error)
    return { success: false, error: "Došlo k neočekávané chybě" }
  }
}

export async function deactivateShop(shopId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Nejdřív ověříme, že přihlášený uživatel má právo deaktivovat tento eshop
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Nejste přihlášen")

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("email", session.user.email)
      .single()
    
    if (!company) throw new Error("Nemáte oprávnění k této akci")

    // Deaktivace eshopu
    const { error } = await supabase
      .from("shops")
      .update({ status: "inactive", deactivated_at: new Date().toISOString() })
      .eq("id", shopId)
      .eq("company_id", company.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deactivating shop:", error)
    return { success: false, error: "Nepodařilo se deaktivovat eshop" }
  }
}
