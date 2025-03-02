import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Získat aktuální session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Opravený dotaz - změna názvu tabulky z 'eshops' na 'shops'
  const { data: shops } = await supabase
    .from('shops')
    .select('*')
    .eq('company_id', session?.user?.user_metadata?.company_id)

  return NextResponse.json(shops)
} 