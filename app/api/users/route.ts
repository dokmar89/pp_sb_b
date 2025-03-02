import { createClient } from '@supabase/supabase-js'
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const requestData = await request.json()
  const { email, password, fullName, role } = requestData
  
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Chybí povinné údaje" }, { status: 400 })
  }
  
  try {
    // Vytvořit admin klienta přímo pomocí service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Nejprve zkontrolujeme, zda uživatel s tímto emailem již existuje
    const { data: existingUser } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (existingUser) {
      return NextResponse.json({ error: "Uživatel s tímto emailem již existuje" }, { status: 400 })
    }
    
    // Použít SQL dotaz přímo pro vytvoření uživatele
    const { data, error } = await supabaseAdmin.rpc('admin_create_user', {
      user_email: email,
      user_password: password,
      user_metadata: { full_name: fullName, role: role || 'user' }
    })
    
    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Vytvořit záznam v public.users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: data.id,
        email: email,
        full_name: fullName,
        role: role || 'user'
      })
    
    if (profileError) {
      console.error("Error creating profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error("Chyba při vytváření uživatele:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
