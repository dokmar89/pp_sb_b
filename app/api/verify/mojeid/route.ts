import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { shop_id } = body

    // Kontrola, zda jsme v demo režimu
    const isDemo = shop_id === "demo" || !process.env.MOJEID_API_KEY

    if (isDemo) {
      return NextResponse.json({
        url: "/demo/mojeid-verification",
        verification_id: "demo_verification",
      })
    }

    // Ověření API klíče
    const { data: shop, error: shopError } = await supabase.from("shops").select("*").eq("id", shop_id).single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
    }

    if (!process.env.MOJEID_API_KEY || !process.env.MOJEID_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Chybí potřebné environment variables pro MojeID")
    }

    // Vytvoření nové verifikace
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .insert({
        shop_id,
        method: "mojeid",
        status: "pending",
        price: 15,
      })
      .select()
      .single()

    if (verificationError) {
      throw verificationError
    }

    // Inicializace MojeID procesu
    const mojeIdResponse = await fetch("https://api.mojeid.cz/v2/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MOJEID_API_KEY}`,
      },
      body: JSON.stringify({
        client_id: process.env.MOJEID_CLIENT_ID,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/verify/mojeid/callback`,
        scope: "identity birthdate",
        state: verification.id,
      }),
    })

    if (!mojeIdResponse.ok) {
      throw new Error("Chyba při komunikaci s MojeID")
    }

    const { auth_url } = await mojeIdResponse.json()

    return NextResponse.json({ url: auth_url, verification_id: verification.id })
  } catch (error) {
    console.error("MojeID verification error:", error)
    return NextResponse.json({ error: "Chyba při inicializaci MojeID verifikace" }, { status: 500 })
  }
}

