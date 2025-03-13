export const dynamic = "force-dynamic";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Ověření přístupu
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Získání company_id uživatele
    const { data: company } = await supabase
      .from("companies")  
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Ověření vlastnictví eshopu
    const { data: shop } = await supabase
      .from("shops")
      .select("company_id")
      .eq("id", params.shopId)
      .single()

    if (!shop || shop.company_id !== company.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generování nového API klíče
    const newApiKey = `sk_${crypto.randomBytes(24).toString("hex")}`

    // Aktualizace API klíče
    const { error } = await supabase
      .from("shops")
      .update({ api_key: newApiKey })
      .eq("id", params.shopId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, apiKey: newApiKey })
  } catch (error) {
    console.error("Error regenerating API key:", error)
    return NextResponse.json(
      { error: "Failed to regenerate API key" },
      { status: 500 }
    )
  }
} 