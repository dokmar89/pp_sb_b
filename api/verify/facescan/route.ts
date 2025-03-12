import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { detectAge, getAgeVerificationResult } from "@/lib/face-detection"

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
    const { data: shop, error: shopError } = await supabase.from("shops").select("*").eq("id", shopId).single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
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
      throw verificationError
    }

    // Zpracování snímku obličeje
    const result = await detectAge(image)

    if (!result.age) {
      throw new Error("Nepodařilo se detekovat věk")
    }

    const verificationResult = getAgeVerificationResult(result.age)

    // Aktualizace verifikace
    const { error: updateError } = await supabase
      .from("verifications")
      .update({
        result: verificationResult === "approved" ? "success" : "failure",
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
      result: verificationResult,
    })
  } catch (error) {
    console.error("FaceScan verification error:", error)
    return NextResponse.json({ error: "Chyba při zpracování snímku obličeje" }, { status: 500 })
  }
}

