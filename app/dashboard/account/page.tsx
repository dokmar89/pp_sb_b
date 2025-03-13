import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { Building2, Users } from "lucide-react"
import { AccountForm } from "@/components/account/account-form"
import { UserManagement } from "@/components/account/user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
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

  return (
    <div className="container py-8">
      <Tabs defaultValue="company" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Účet a nastavení</h1>
            <p className="text-muted-foreground mt-1">
              Správa účtu, společnosti a uživatelů
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Údaje o společnosti
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Správa uživatelů
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="company">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Údaje o společnosti</CardTitle>
                <CardDescription>
                  Základní informace o vaší společnosti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountForm company={company} readOnly={true} />
              </CardContent>
            </Card>

        
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <UserManagement companyId={company.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
