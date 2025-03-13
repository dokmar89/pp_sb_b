import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // ID verifikace

    if (!code || !state) {
      throw new Error("Chybějící parametry")
    }

    // Výměna kódu za token
    const tokenResponse = await fetch("https://api.bankid.cz/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.BANKID_CLIENT_ID}:${process.env.BANKID_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/verify/bankid/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Chyba při získávání tokenu")
    }

    const { access_token } = await tokenResponse.json()

    // Získání dat o uživateli
    const userResponse = await fetch("https://api.bankid.cz/v1/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Chyba při získávání dat o uživateli")
    }

    const userData = await userResponse.json()

    // Ověření věku
    const birthDate = new Date(userData.birthdate)
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    const isVerified = age >= 18

    // Aktualizace verifikace
    const { error: updateError } = await supabase
      .from("verifications")
      .update({
        result: isVerified ? "success" : "failure",
        status: "completed",
      })
      .eq("id", state)

    if (updateError) {
      throw updateError
    }

    // Přesměrování zpět do aplikace
    const redirectUrl = new URL("/verification-result", process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set("status", isVerified ? "success" : "failure")
    redirectUrl.searchParams.set("verification_id", state)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("BankID callback error:", error)
    return NextResponse.redirect(new URL("/verification-result?status=error", process.env.NEXT_PUBLIC_APP_URL))
  }
}

