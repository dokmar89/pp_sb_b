import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { TransactionHistory } from "@/components/account/transaction-history"
import { CheckAllPaymentsButton } from "@/components/check-all-payments-button"

export default async function BillingPage() {
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

  // Načteme počet čekajících plateb
  const { count: pendingCount } = await supabase
    .from("wallet_transactions")
    .select("*", { count: 'exact', head: true })
    .eq("company_id", company.id)
    .eq("status", "pending");

  return (
    <div className="container py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historie transakcí</h1>
          <p className="text-muted-foreground mt-1">
            Přehled všech transakcí a plateb
          </p>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Čekající platby: {pendingCount}
            </span>
            <CheckAllPaymentsButton />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <TransactionHistory companyId={company.id} />
        </CardContent>
      </Card>
    </div>
  )
}
