import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    try {
        const { data: { session } } = await supabase.auth.getSession()

        // Povolíme přístup k veřejným cestám a souborům
        const publicPaths = ['/', '/auth', '/auth/login', '/auth/callback']
        if (
            publicPaths.some(path => request.nextUrl.pathname.startsWith(path)) ||
            request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|ico)$/)
        ) {
            return res
        }

        // Pro ostatní cesty vyžadujeme přihlášení
        if (!session) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        return res
    } catch (error) {
        console.error("Auth error:", error)
        return NextResponse.redirect(new URL('/', request.url))
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}