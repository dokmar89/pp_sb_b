import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"

// Create a new session or get an existing one
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { shop_id, verification_id } = body

    if (!shop_id) {
      return NextResponse.json({ error: "Chybějící parametry" }, { status: 400 })
    }

    // Generate a unique session ID
    const session_id = uuidv4()

    // Create a new session record
    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .insert({
        session_id,
        shop_id,
        verification_id: verification_id || null,
        status: "pending"
      })
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    return NextResponse.json({
      success: true,
      session_id: session_id
    })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Chyba při vytváření session" }, { status: 500 })
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