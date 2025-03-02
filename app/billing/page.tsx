import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { BillingForm } from "@/components/account/billing-form"
import { TransactionHistory } from "@/components/account/transaction-history"
import { MainNav } from "@/components/nav/main-nav"

export default async function BillingPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Fetch company data
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  if (!company) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Účet nenalezen</h2>
          <p className="text-muted-foreground">Nemáte přístup k firemnímu účtu</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r bg-background">
        <MainNav />
      </div>
      <div className="flex-1">
        <div className="container py-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Fakturace</h1>
            <p className="text-muted-foreground">Správa fakturačních údajů a historie transakcí</p>
          </div>

          <div className="grid gap-6">
            {/* Fakturační údaje */}
            <BillingForm company={company} />

            {/* Historie transakcí */}
            <TransactionHistory companyId={company.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
