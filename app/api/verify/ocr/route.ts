import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { processIdCard } from "@/lib/ocr"

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const shopId = formData.get("shop_id") as string

    if (!image || !shopId) {
      return NextResponse.json({
        error: "Chybějící parametry",
        details: !image ? "Chybí obrázek dokladu" : "Chybí ID obchodu"
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

    // Ověření shop_id
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
        method: "ocr",
        status: "pending",
        price: 10, // Cena za OCR verifikaci
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

    // Zpracování snímku dokladu
    try {
      // Převedení File na Blob/ArrayBuffer pro OCR zpracování
      const arrayBuffer = await image.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: image.type });
      
      const result = await processIdCard(blob);

      if (!result.success || !result.age) {
        // Aktualizace neúspěšné verifikace
        await supabase
          .from("verifications")
          .update({
            result: "failure",
            status: "completed",
            result_details: result.error || "Nepodařilo se rozpoznat věk z dokladu"
          })
          .eq("id", verification.id)

        return NextResponse.json({
          success: false,
          error: result.error || "Nepodařilo se rozpoznat věk z dokladu",
          verification_id: verification.id
        }, { status: 422 })
      }

      // Určení výsledku verifikace
      const verificationResult = result.age >= 18 ? "approved" : "rejected"

      // Aktualizace verifikace
      const { error: updateError } = await supabase
        .from("verifications")
        .update({
          result: verificationResult === "approved" ? "success" : "failure",
          status: "completed",
          result_details: JSON.stringify({
            age: result.age,
            birthDate: result.birthDate ? result.birthDate.toISOString() : null
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
        birthDate: result.birthDate ? result.birthDate.toISOString() : null,
        result: verificationResult
      })
    } catch (ocrError) {
      console.error("OCR processing error:", ocrError);
      
      // Aktualizace neúspěšné verifikace
      await supabase
        .from("verifications")
        .update({
          result: "error",
          status: "error",
          result_details: `Chyba při zpracování OCR: ${ocrError instanceof Error ? ocrError.message : "Neznámá chyba"}`
        })
        .eq("id", verification.id)
        
      return NextResponse.json({
        success: false,
        error: "Chyba při zpracování dokladu",
        details: ocrError instanceof Error ? ocrError.message : "Neznámá chyba",
        verification_id: verification.id
      }, { status: 500 })
    }
  } catch (error) {
    console.error("OCR verification error:", error)
    return NextResponse.json({
      error: "Chyba při zpracování dokladu",
      details: error instanceof Error ? error.message : "Neznámá chyba"
    }, { status: 500 })
  }
}

