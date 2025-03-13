import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const body = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  })

  return NextResponse.json({ message: 'Success' })
} 