import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { detectAge, getAgeVerificationResult } from "@/lib/face-detection"

// Funkce pro zpracování POST požadavku
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const shopId = formData.get("shop_id") as string

    if (!image || !shopId) {
      return NextResponse.json({ 
        error: "Chybějící parametry", 
        details: !image ? "Chybí obrázek" : "Chybí ID obchodu" 
      }, { status: 400 })
    }

    // Kontrola, zda image je skutečně soubor
    if (!(image instanceof File)) {
      return NextResponse.json({ 
        error: "Neplatný formát obrázku", 
        details: "Obrázek musí být soubor" 
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Ověření API klíče / shop_id
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, status, api_key")
      .eq("id", shopId)
      .single()

    if (shopError) {
      console.error("Error fetching shop:", shopError);
      return NextResponse.json({ 
        error: "Nepodařilo se ověřit obchod", 
        details: shopError.message 
      }, { status: 500 })
    }

    if (!shop) {
      return NextResponse.json({ 
        error: "Neplatný obchod", 
        details: "Obchod s daným ID nebyl nalezen" 
      }, { status: 401 })
    }

    if (shop.status !== "active") {
      return NextResponse.json({ 
        error: "Obchod není aktivní", 
        details: `Aktuální stav: ${shop.status}` 
      }, { status: 403 })
    }

    // Vytvoření nové verifikace
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .insert({
        shop_id: shopId,
        method: "facescan",
        status: "pending",
        price: 5, // Cena za FaceScan verifikaci
      })
      .select()
      .single()

    if (verificationError) {
      console.error("Error creating verification:", verificationError);
      throw verificationError
    }

    if (!verification) {
      return NextResponse.json({ 
        error: "Nepodařilo se vytvořit verifikaci", 
        details: "Databáze nevrátila vytvořenou verifikaci" 
      }, { status: 500 })
    }

    // Zpracování snímku obličeje
    try {
      const result = await detectAge(image)

      if (!result.age) {
        // Aktualizace neúspěšné verifikace
        await supabase
          .from("verifications")
          .update({
            result: "failure",
            status: "completed",
            result_details: "Nepodařilo se detekovat věk"
          })
          .eq("id", verification.id)

        return NextResponse.json({ 
          success: false, 
          error: "Nepodařilo se detekovat věk na obrázku", 
          verification_id: verification.id 
        }, { status: 422 })
      }

      const verificationResult = getAgeVerificationResult(result.age)

      // Aktualizace verifikace
      const { error: updateError } = await supabase
        .from("verifications")
        .update({
          result: verificationResult === "approved" ? "success" : verificationResult === "rejected" ? "failure" : "uncertain",
          status: "completed",
          result_details: JSON.stringify({
            age: result.age,
            verification_result: verificationResult
          })
        })
        .eq("id", verification.id)

      if (updateError) {
        console.error("Error updating verification:", updateError);
        throw updateError
      }

      return NextResponse.json({
        success: true,
        verification_id: verification.id,
        age: result.age,
        result: verificationResult,
      })
    } catch (detectionError) {
      console.error("Face detection error:", detectionError);
      
      // Aktualizace neúspěšné verifikace
      await supabase
        .from("verifications")
        .update({
          result: "error",
          status: "error",
          result_details: `Chyba při detekci: ${detectionError instanceof Error ? detectionError.message : "Neznámá chyba"}`
        })
        .eq("id", verification.id)
        
      return NextResponse.json({ 
        success: false, 
        error: "Chyba při zpracování snímku obličeje",
        details: detectionError instanceof Error ? detectionError.message : "Neznámá chyba", 
        verification_id: verification.id 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("FaceScan verification error:", error)
    return NextResponse.json({ 
      error: "Chyba při zpracování snímku obličeje",
      details: error instanceof Error ? error.message : "Neznámá chyba" 
    }, { status: 500 })
  }
}

