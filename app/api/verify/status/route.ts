import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const verificationId = searchParams.get("verification_id")

    if (!verificationId) {
      return NextResponse.json({ error: "Chybí ID verifikace" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data: verification, error } = await supabase
      .from("verifications")
      .select("*")
      .eq("id", verificationId)
      .single()

    if (error || !verification) {
      return NextResponse.json({ error: "Verifikace nenalezena" }, { status: 404 })
    }

    return NextResponse.json({
      status: verification.status,
      result: verification.result,
      method: verification.method,
    })
  } catch (error) {
    console.error("Verification status error:", error)
    return NextResponse.json({ error: "Chyba při získávání stavu verifikace" }, { status: 500 })
  }
}

