// app/dashboard/billing/page.tsx
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { BillingPageClient } from "./billing-page-client";

const paymentStatusOptions = [
  { value: "all", label: "Všechny" },
  { value: "completed", label: "Zaplacené" }, // Use 'completed' to match DB
  { value: "pending", label: "Čekající" },
  { value: "failed", label: "Nezaplacené" }, // Use 'failed' to match DB
];

const transactionTypeOptions = [
  { value: "all", label: "Všechny" },
  { value: "credit", label: "Dobití kreditu" },
  { value: "debit", label: "Odečtení kreditu" },
];

export default async function BillingPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

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

  const { count: pendingCount } = await supabase
    .from("wallet_transactions")
    .select("*", { count: 'exact', head: true })
    .eq("company_id", company.id)
    .eq("status", "pending");

  const { data: initialInvoicesData, error: initialInvoicesError } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("company_id", company.id);

  if (initialInvoicesError) {
    console.error("Error fetching invoices:", initialInvoicesError);
  }

  const initialInvoices = initialInvoicesData || [];

  return (
    <BillingPageClient
      initialInvoices={initialInvoices}
      pendingCount={pendingCount || 0}
      paymentStatusOptions={paymentStatusOptions}
      transactionTypeOptions={transactionTypeOptions}
    />
  )
}