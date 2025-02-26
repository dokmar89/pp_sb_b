import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { checkCredit } from "@/lib/actions/credit"

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing API key" 
      }, { status: 401 })
    }

    const apiKey = authHeader.split(" ")[1]
    const supabase = createRouteHandlerClient({ cookies })

    // Fetch shop and customization data
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select(`
        id,
        status,
        company_id,
        customizations (
          logo_url,
          primary_color,
          secondary_color,
          font,
          button_style,
          verification_methods,
          texts,
          images
        )
      `)
      .eq("api_key", apiKey)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid API key" 
      }, { status: 401 })
    }

    if (shop.status !== "active") {
      return NextResponse.json({ 
        success: false, 
        error: "Shop is not active" 
      }, { status: 403 })
    }

    // Check credit
    const { hasCredit, creditsLeft } = await checkCredit(shop.company_id)
    
    if (!hasCredit) {
      return NextResponse.json({
        success: false,
        error: "Insufficient credit",
        creditsLeft,
      }, { status: 402 }) // 402 Payment Required
    }

    // Return success with customization and shop data
    return NextResponse.json({
      success: true,
      hasCredit: true,
      creditsLeft,
      customization: shop.customizations,
      shopId: shop.id,
    })

  } catch (error) {
    console.error("Initialization error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 