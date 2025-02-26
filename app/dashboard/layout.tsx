import type React from "react"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

import { SidebarNav } from "@/components/sidebar-nav"
import { UserButton } from "@/components/auth/user-button"
import { DashboardNav } from "@/components/dashboard-nav"

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
      {/* Sidebar */}
      <div className="w-64 border-r bg-sidebar-background">
        <SidebarNav />
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="flex h-16 items-center justify-between border-b px-8">
          <div className="flex items-center space-x-4">
            <UserButton />
          </div>
        </div>
        <div className="container p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

