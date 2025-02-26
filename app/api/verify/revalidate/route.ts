import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop_id, identifier, method } = body

    if (!shop_id || !identifier || !method) {
      return NextResponse.json({ error: "Chybějící parametry" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Ověření API klíče
    const { data: shop, error: shopError } = await supabase.from("shops").select("*").eq("id", shop_id).single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
    }

    // Vytvoření nové verifikace
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .insert({
        shop_id,
        method: "revalidate",
        status: "pending",
        price: 2, // Cena za opakované ověření
      })
      .select()
      .single()

    if (verificationError) {
      throw verificationError
    }

    // Zde by byla logika pro ověření uloženého identifikátoru
    // Pro demo účely simulujeme úspěšné ověření
    const { error: updateError } = await supabase
      .from("verifications")
      .update({
        result: "success",
        status: "completed",
      })
      .eq("id", verification.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      verification_id: verification.id,
      is_verified: true,
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Chyba při opakovaném ověření" }, { status: 500 })
  }
}

