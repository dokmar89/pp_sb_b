import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Chybí API klíč" }, { status: 401 })
    }

    const apiKey = authHeader.split(" ")[1]
    const supabase = createRouteHandlerClient({ cookies })

    // Fetch shop and customization data
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select(`
        *,
        customizations (*)
      `)
      .eq("api_key", apiKey)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Neplatný API klíč" }, { status: 401 })
    }

    if (shop.status !== "active") {
      return NextResponse.json({ error: "Eshop není aktivní" }, { status: 403 })
    }

    return NextResponse.json(shop.customizations)
  } catch (error) {
    console.error("Error fetching customization:", error)
    return NextResponse.json({ error: "Chyba při načítání nastavení" }, { status: 500 })
  }
}

