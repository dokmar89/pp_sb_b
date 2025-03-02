import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { z } from "zod"

const initializeSchema = z.object({
  shopId: z.string(),
  verificationMethod: z.string(),
  redirectUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopId, verificationMethod, redirectUrl } = initializeSchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })

    // Ověření API klíče
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Eshop nenalezen" }, { status: 404 })
    }

    if (shop.status !== "active") {
      return NextResponse.json({ error: "Eshop není aktivní" }, { status: 403 })
    }

    // Ověření, že metoda je povolená pro tento eshop
    if (!shop.verification_methods.includes(verificationMethod)) {
      return NextResponse.json(
        { error: "Tato metoda ověření není pro tento eshop povolena" },
        { status: 400 }
      )
    }

    // Vytvoření nové verifikace
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .insert({
        shop_id: shopId,
        method: verificationMethod,
        status: "pending",
        redirect_url: redirectUrl
      })
      .select()
      .single()

    if (verificationError) {
      throw verificationError
    }

    return NextResponse.json({
      verificationId: verification.id,
      status: verification.status
    })
  } catch (error) {
    console.error("Error initializing verification:", error)
    return NextResponse.json(
      { error: "Nepodařilo se inicializovat ověření" },
      { status: 500 }
    )
  }
} 