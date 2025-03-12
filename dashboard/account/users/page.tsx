import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { UserManagement } from "@/components/account/user-management"

export default async function UsersPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    redirect("/auth/login")
  }

  // Získání company_id
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  if (companyError || !company) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <UserManagement companyId={company.id} />
    </div>
  )
} 