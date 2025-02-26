import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Získat aktuální session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Upravený dotaz - přidáno filtrování podle company_id
  const { data: eshops } = await supabase
    .from('eshops')
    .select('*')
    .eq('company_id', session?.user?.user_metadata?.company_id)

  return NextResponse.json(eshops)
} 