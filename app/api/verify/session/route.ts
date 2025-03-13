import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"

// Create a new session or get an existing one
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    // Parsování požadavku
    const requestData = await request.json()
    console.log("Received request data:", requestData)
    
    // Získání API klíče z požadavku (podporujeme oba formáty)
    const apiKey = requestData.api_key || requestData.shop_id
    
    if (!apiKey) {
      console.error('Missing API key in request')
      return NextResponse.json(
        { error: 'Missing API key parameter (api_key or shop_id)' },
        { status: 400 }
      )
    }
    
    console.log("Processing request for API key:", apiKey)
    
    // Vytvoření Supabase klienta
    const supabase = createRouteHandlerClient({ cookies })
    
    // Kontrola, zda shop existuje
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, status')
      .eq('api_key', apiKey)
      .single()
    
    if (shopError) {
      console.error('Error fetching shop:', shopError)
    }
    
    if (!shop) {
      console.error('Shop not found for API key:', apiKey)
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }
    
    if (shop.status !== 'active') {
      console.error('Shop is not active:', shop.status)
      return NextResponse.json(
        { error: 'Shop is not active' },
        { status: 403 }
      )
    }
    
    // Generování unikátního ID pro session
    const session_id = uuidv4()
    console.log("Generated session ID:", session_id)
    
    // Vytvoření záznamu v tabulce verification_sessions
    const { data, error } = await supabase
      .from('verification_sessions')
      .insert({
        id: session_id,
        shop_id: shop.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Platnost 30 minut
        verification_method: 'other_device'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating session in database:', error)
      return NextResponse.json(
        { error: 'Failed to create session in database' },
        { status: 500 }
      )
    }
    
    console.log("Session created successfully:", data)
    
    return NextResponse.json({
      session_id,
      expires_at: data.expires_at
    })
  } catch (error) {
    console.error('Unexpected error in session creation:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// Get session status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const session_id = searchParams.get("session_id")

    if (!session_id) {
      return NextResponse.json({ error: "Chybí ID session" }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("session_id", session_id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: "Session nenalezena" }, { status: 404 })
    }

    // If there's a verification_id, get its details
    let verification = null
    if (session.verification_id) {
      const { data: verificationData, error: verificationError } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", session.verification_id)
        .single()
      
      if (!verificationError) {
        verification = verificationData
      }
    }

    return NextResponse.json({
      status: session.status,
      verification_id: session.verification_id,
      verification: verification
    })
  } catch (error) {
    console.error("Session status error:", error)
    return NextResponse.json({ error: "Chyba při získávání stavu session" }, { status: 500 })
  }
}

// Update session with verification ID
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { session_id, verification_id, status } = body

    if (!session_id || !verification_id) {
      return NextResponse.json({ error: "Chybějící parametry" }, { status: 400 })
    }

    const updateData: any = { verification_id }
    if (status) {
      updateData.status = status
    }

    const { data: session, error } = await supabase
      .from("verification_sessions")
      .update(updateData)
      .eq("session_id", session_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      session: session
    })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ error: "Chyba při aktualizaci session" }, { status: 500 })
  }
} 