import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { InstallationGuide } from "@/components/installation/installation-guide"
import { InstallationTabs } from "@/components/installation/installation-tabs"

export default async function InstallationPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instalace</h1>
        <p className="text-muted-foreground">Návod k instalaci a implementaci věkové verifikace</p>
      </div>
      <InstallationTabs />
      <InstallationGuide />
    </div>
  )
}