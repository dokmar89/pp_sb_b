import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentVerifications } from "@/components/recent-verifications"
import { WalletBalance } from "@/components/wallet-balance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Debug log
  console.log("Session user:", session.user)

  // Fetch company data using user_id
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // Debug log
  console.log("Company data:", company)
  console.log("Company error:", companyError)

  if (!company) {
    console.log("No company found for user")
    redirect("/auth/login")
  }

  // Fetch verifications for all company's shops
  const { data: shops } = await supabase.from("shops").select("id").eq("company_id", company.id)

  const shopIds = shops?.map((shop) => shop.id) || []

  // Debug log
  console.log("Shop IDs:", shopIds)

  const { data: verifications, error: verificationsError } = await supabase
    .from("verifications")
    .select("*")
    .in("shop_id", shopIds)
    .order("created_at", { ascending: false })
    .limit(5)

  // Debug log
  console.log("Verifications:", verifications)
  console.log("Verifications error:", verificationsError)

  // Fetch wallet transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("company_id", company.id)
    .eq("status", "completed")

  // Debug log
  console.log("Transactions:", transactions)
  console.log("Transactions error:", transactionsError)

  const balance =
    transactions?.reduce((acc, transaction) => {
      if (transaction.type === "credit") {
        return acc + transaction.amount
      } else {
        return acc - transaction.amount
      }
    }, 0) || 0

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vítejte, {company.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <DashboardStats verifications={verifications} />
        <WalletBalance balance={balance} companyId={company.id} />
      </div>

      <div className="grid gap-6">
        <RecentVerifications verifications={verifications} />
      </div>
    </div>
  )
}