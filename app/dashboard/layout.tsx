import type React from "react"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

import { MainNav } from "@/components/nav/main-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // This should be handled by middleware
  }

  return (
    <div className="flex min-h-screen">
      <MainNav />
      <main className="flex-1">
        <div className="container p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
