import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { AccountForm } from "@/components/account/account-form"
import { TransactionHistory } from "@/components/account/transaction-history"

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Fetch company data
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  if (!company) {
    return <div>Načítání...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Účet a platby</h1>
        <p className="text-muted-foreground">Správa účtu a přehled transakcí</p>
      </div>
      <div className="grid gap-6">
        <AccountForm company={company} />
        <TransactionHistory companyId={company.id} />
      </div>
    </div>
  )
}

