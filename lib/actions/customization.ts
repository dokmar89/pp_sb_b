"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabaseAdmin } from "@/lib/supabase/server"

const customizationSchema = z.object({
  shopId: z.string().uuid(),
  logo: z.string().url().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  font: z.string(),
  buttonStyle: z.string(),
  verificationMethods: z.array(z.string()),
  failureAction: z.string(),
  failureRedirect: z.string().url().optional(),
})

export async function updateCustomization(formData: z.infer<typeof customizationSchema>) {
  console.log("1. Začínám ukládání:", formData) // DEBUG LOG

  try {
    // Nejdřív TVRDĚ smažeme
    const { error: deleteError } = await supabaseAdmin
      .from("customizations")
      .delete()
      .eq("shop_id", formData.shopId)
    
    if (deleteError) {
      console.error("Chyba při mazání:", deleteError)
      throw deleteError
    }

    console.log("2. Smazáno") // DEBUG LOG

    // Pak vytvoříme nový záznam
    const { data, error: insertError } = await supabaseAdmin
      .from("customizations")
      .insert({
        shop_id: formData.shopId,
        logo_url: formData.logo || null,
        primary_color: formData.primaryColor,
        secondary_color: formData.secondaryColor,
        font: formData.font,
        button_style: formData.buttonStyle,
        verification_methods: formData.verificationMethods,
        failure_action: formData.failureAction,
        failure_redirect: formData.failureRedirect || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Chyba při vkládání:", insertError)
      throw insertError
    }

    console.log("3. Vloženo:", data) // DEBUG LOG

    // Force revalidace
    revalidatePath("/dashboard/customize", "layout")
    revalidatePath(`/dashboard/customize?shopId=${formData.shopId}`, "page")
    
    return { success: true, data }
  } catch (error) {
    console.error("FATAL ERROR:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Kurva, něco se posralo" 
    }
  }
}

export async function getCustomization(shopId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("customizations")
      .select("*")
      .eq("shop_id", shopId)
      .single()

    if (error) throw error

    return { 
      success: true, 
      data: {
        logo: data?.logo_url || "",
        primaryColor: data?.primary_color || "#000000",
        secondaryColor: data?.secondary_color || "#FFFFFF",
        font: data?.font || "inter",
        buttonStyle: data?.button_style || "rounded",
        verificationMethods: data?.verification_methods || [],
        failureAction: data?.failure_action || "redirect",
        failureRedirect: data?.failure_redirect || "",
      }
    }
  } catch (error) {
    console.error("Error fetching customization:", error)
    return { 
      success: false, 
      error: "Nepodařilo se načíst nastavení"
    }
  }
}

