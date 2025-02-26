import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { shop_id } = body

    // Kontrola, zda jsme v demo režimu
    const isDemo = shop_id === "demo" || !process.env.BANKID_API_KEY

    if (isDemo) {
      return NextResponse.json({
        url: "/demo/bankid-verification",
        verification_id: "demo_verification",
      })
    }

    // Ověření API klíče
    const { data: shop, error: shopError } = await supabase.from("shops").select("*").eq("id", shop_id).single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
    }

    if (!process.env.BANKID_API_KEY || !process.env.BANKID_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Chybí potřebné environment variables pro BankID")
    }

    // Vytvoření nové verifikace
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .insert({
        shop_id,
        method: "bankid",
        status: "pending",
        price: 20,
      })
      .select()
      .single()

    if (verificationError) {
      throw verificationError
    }

    // Inicializace BankID procesu
    const bankIdResponse = await fetch("https://api.bankid.cz/v1/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BANKID_API_KEY}`,
      },
      body: JSON.stringify({
        client_id: process.env.BANKID_CLIENT_ID,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/verify/bankid/callback`,
        scope: "identity_verification",
        state: verification.id,
      }),
    })

    if (!bankIdResponse.ok) {
      throw new Error("Chyba při komunikaci s BankID")
    }

    const { auth_url } = await bankIdResponse.json()

    return NextResponse.json({ url: auth_url, verification_id: verification.id })
  } catch (error) {
    console.error("BankID verification error:", error)
    return NextResponse.json({ error: "Chyba při inicializaci BankID verifikace" }, { status: 500 })
  }
}

