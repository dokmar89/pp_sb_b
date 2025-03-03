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

interface CreateShopInput {
  name: string;
  url: string;
  sector: string;
  verificationMethods: string[];
  integrationType: string;
  pricingPlan: string;
  companyId: string;
}

export async function createShop(input: CreateShopInput) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data: shop, error } = await supabase
      .from("shops")
      .insert({
        name: input.name,
        url: input.url,
        sector: input.sector,
        verification_methods: input.verificationMethods,
        integration_type: input.integrationType,
        pricing_plan: input.pricingPlan,
        company_id: input.companyId,
        status: "active",
        api_key: `sk_${crypto.randomBytes(24).toString('hex')}`
      })
      .select()
      .single()

    if (error) throw error

    // Create default customization
    await supabaseAdmin.from("customizations").insert({
      shop_id: shop.id,
      primary_color: "#000000",
      secondary_color: "#ffffff",
      font: "inter",
      button_style: "rounded",
      verification_methods: input.verificationMethods,
      failure_action: "block",
    })

    revalidatePath("/dashboard/shops")
    return { success: true, data: shop }
  } catch (error) {
    console.error("Error creating shop:", error)
    return { success: false, error: "Došlo k chybě při vytváření eshopu" }
  }
}

export async function updateShopStatus(shopId: string, status: "active" | "inactive") {
  try {
    console.log("Updating shop status:", { shopId, status }) // Debug log

    // Použijeme supabaseAdmin místo createServerActionClient
    const { data: shop, error: checkError } = await supabaseAdmin
      .from("shops")
      .select("status")
      .eq("id", shopId)
      .single()

    if (checkError) {
      console.error("Error checking shop:", checkError)
      return { success: false, error: "Eshop nebyl nalezen" }
    }

    // Aktualizace statusu pomocí supabaseAdmin
    const { error } = await supabaseAdmin
      .from("shops")
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", shopId)

    if (error) {
      console.error("Error updating shop status:", error)
      return { success: false, error: "Nepodařilo se aktualizovat status eshopu" }
    }

    // Revalidace cesty pro obnovení dat
    revalidatePath("/dashboard/shops")
    
    return { 
      success: true,
      data: {
        id: shopId,
        status: status
      }
    }
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
      .eq("result", "success")
      .single()

    const { data: failedVerifications, error: failedError } = await supabase
      .from("verifications")
      .select("count")
      .eq("shop_id", shopId)
      .eq("result", "failure")
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