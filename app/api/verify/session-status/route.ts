import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

// Endpoint pro kontrolu stavu session
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({
        error: "Chybějící parametry",
        details: "Chybí ID session"
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Načtení session podle ID
    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json({
        error: "Nepodařilo se načíst data session",
        details: sessionError.message
      }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({
        error: "Session nenalezena",
        details: "Session s daným ID neexistuje"
      }, { status: 404 })
    }

    // Kontrola, zda session neexpirovala
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({
        error: "Session expirovala",
        status: "expired",
        details: "Platnost session vypršela"
      }, { status: 410 })
    }

    // Pokud má session přiřazenou verifikaci, načteme její detaily
    let verification = null
    if (session.verification_id) {
      const { data: verificationData, error: verificationError } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", session.verification_id)
        .single()

      if (verificationError) {
        console.error("Error fetching verification:", verificationError);
      } else {
        verification = verificationData
      }
    }

    // Vrátíme aktuální stav session
    return NextResponse.json({
      status: session.status,
      created_at: session.created_at,
      expires_at: session.expires_at,
      verification_id: session.verification_id,
      verification: verification ? {
        id: verification.id,
        status: verification.status,
        result: verification.result,
        method: verification.method,
        created_at: verification.created_at
      } : null
    })
  } catch (error) {
    console.error("Error checking session status:", error)
    return NextResponse.json({
      error: "Chyba při kontrole stavu session",
      details: error instanceof Error ? error.message : "Neznámá chyba"
    }, { status: 500 })
  }
} 