import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    console.log("Middleware started for path:", request.nextUrl.pathname); // LOG 1: Middleware start
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    console.log("createMiddlewareClient initialized"); // LOG 2: Middleware Supabase client initialized

    try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("getSession() called in middleware"); // LOG 3: Middleware getSession() called

        console.log("Session data in middleware:", session); // LOG 5: Middleware session data

        // Povolíme přístup na hlavní stránku bez přihlášení
        if (request.nextUrl.pathname === "/") {
            console.log("Path is '/', allowing access"); // LOG 6: Path is /
            return res
        }

        // Pokud jsme na /auth/* cestě a máme session, přesměrujeme na dashboard
        if (request.nextUrl.pathname.startsWith("/auth/") && session) {
            console.log("Path starts with '/auth/' and session exists, redirecting to dashboard"); // LOG 7: /auth/ + session redirect
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }

        // Pokud nejsme na /auth/* cestě a nemáme session, přesměrujeme na login
        if (!request.nextUrl.pathname.startsWith("/auth/") && !session) {
            console.warn("Path does not start with '/auth/' and no session, redirecting to login"); // LOG 9: Not /auth/ + no session redirect
            return NextResponse.redirect(
                new URL(`/auth/login?redirect=${request.nextUrl.pathname}`, request.url)
            )
        }

        console.log("Middleware finished, proceeding to next handler"); // LOG 11: Middleware finish
        return res
    } catch (error) {
        console.error("Middleware error:", error)
        // Při chybě přesměrujeme na login
        if (!request.nextUrl.pathname.startsWith("/auth/")) {
            return NextResponse.redirect(
                new URL(`/auth/login?redirect=${request.nextUrl.pathname}`, request.url)
            )
        }
        return res
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
}