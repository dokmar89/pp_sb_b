import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { DashboardStats } from "@/components/dashboard-stats"
import { RecentVerifications } from "@/components/recent-verifications"
import { WalletBalance } from "@/components/wallet-balance"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

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
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Účet nenalezen</h2>
          <p className="text-muted-foreground">Nemáte přístup k firemnímu účtu</p>
        </div>
      </div>
    )
  }

  // Fetch verifications for all company's shops
  const { data: verifications } = await supabase
    .from("verifications")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vítejte, {company.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <DashboardStats verifications={verifications || []} />
        <WalletBalance companyId={company.id} balance={company.balance || 0} />
      </div>

      <div className="grid gap-4">
        <RecentVerifications verifications={verifications || []} />
      </div>
    </div>
  )
}