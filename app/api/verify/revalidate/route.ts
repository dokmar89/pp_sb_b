import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { shop_id, identifier } = requestData

    if (!shop_id || !identifier) {
      return NextResponse.json({
        error: "Chybějící parametry",
        details: !shop_id ? "Chybí ID obchodu" : "Chybí identifikátor uživatele"
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Ověření shop_id
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, status, api_key")
      .eq("id", shop_id)
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

    // Kontrola, zda již existuje úspěšná verifikace pro tento identifikátor
    const { data: existingVerifications, error: verificationError } = await supabase
      .from("verifications")
      .select("id, created_at, method, result")
      .eq("user_identifier", identifier)
      .eq("result", "success")
      .order("created_at", { ascending: false })
      .limit(1)

    if (verificationError) {
      console.error("Error fetching existing verifications:", verificationError);
      return NextResponse.json({
        error: "Nepodařilo se ověřit existující verifikace",
        details: verificationError.message
      }, { status: 500 })
    }

    // Pokud neexistuje předchozí úspěšná verifikace
    if (!existingVerifications || existingVerifications.length === 0) {
      return NextResponse.json({
        success: false,
        is_verified: false,
        error: "Uživatel nebyl dříve ověřen"
      })
    }

    // Vytvoření nové revalidační verifikace
    const { data: verification, error: createError } = await supabase
      .from("verifications")
      .insert({
        shop_id,
        method: "revalidate",
        status: "completed",
        result: "success",
        price: 1, // Nízká cena za revalidaci
        user_identifier: identifier,
        result_details: JSON.stringify({
          previous_verification: existingVerifications[0].id,
          previous_method: existingVerifications[0].method,
          previous_date: existingVerifications[0].created_at
        })
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating revalidation verification:", createError);
      return NextResponse.json({
        error: "Nepodařilo se vytvořit revalidační záznam",
        details: createError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      is_verified: true,
      verification_id: verification.id,
      previous_verification: {
        id: existingVerifications[0].id,
        method: existingVerifications[0].method,
        date: existingVerifications[0].created_at
      }
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({
      error: "Chyba při revalidaci",
      details: error instanceof Error ? error.message : "Neznámá chyba"
    }, { status: 500 })
  }
}

