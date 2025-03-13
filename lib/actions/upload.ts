"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"

export async function uploadLogo(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const shopId = formData.get("shopId") as string

    if (!file || !shopId) {
      return { success: false, error: "Chybí soubor nebo ID eshopu" }
    }

    // Kontrola typu souboru
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Soubor musí být obrázek" }
    }

    // Kontrola velikosti souboru (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "Soubor je příliš velký (max 2MB)" }
    }

    const supabase = createServerActionClient({ cookies })

    // Ověření přístupu k eshopu
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: "Nejste přihlášen" }
    }

    // Ověření přístupu k eshopu
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single()

    if (shopError || !shop) {
      return { success: false, error: "Eshop nenalezen" }
    }

    // Ověření vlastnictví eshopu
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!company || company.id !== shop.company_id) {
      return { success: false, error: "Nemáte oprávnění k tomuto eshopu" }
    }

    // Generování unikátního názvu souboru
    const fileExt = file.name.split(".").pop()
    const fileName = `${shopId}/${uuidv4()}.${fileExt}`

    // Upload do Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { success: false, error: "Nepodařilo se nahrát soubor" }
    }

    // Získání veřejné URL
    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(fileName)

    // Aktualizace URL loga v databázi
    const { error: updateError } = await supabase
      .from("shops")
      .update({ logo_url: publicUrl })
      .eq("id", shopId)

    if (updateError) {
      // Pokud se nepodaří aktualizovat DB, smažeme nahraný soubor
      await supabase.storage
        .from("logos")
        .remove([fileName])
      
      console.error("Update error:", updateError)
      return { success: false, error: "Nepodařilo se aktualizovat logo" }
    }

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "Nepodařilo se nahrát logo" }
  }
} 