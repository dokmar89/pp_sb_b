import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { processIdCard } from "@/lib/ocr"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const shopId = formData.get("shop_id") as string

    if (!image || !shopId) {
      return NextResponse.json({ error: "Chybějící parametry" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Ověření API klíče
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
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
      throw verificationError
    }

    // Zpracování dokladu
    const result = await processIdCard(image)

    if (!result.success) {
      throw new Error(result.error)
    }

    // Aktualizace verifikace
    const { error: updateError } = await supabase
      .from("verifications")
      .update({
        result: result.age && result.age >= 18 ? "success" : "failure",
        status: "completed",
      })
      .eq("id", verification.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      verification_id: verification.id,
      age: result.age,
      is_verified: result.age && result.age >= 18,
    })
  } catch (error) {
    console.error("OCR verification error:", error)
    return NextResponse.json({ error: "Chyba při zpracování dokladu" }, { status: 500 })
  }
}

