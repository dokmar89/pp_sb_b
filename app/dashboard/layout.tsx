import type React from "react"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"

import { MainNav } from "@/components/nav/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic";
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
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen">
      <MainNav />
      <div className="flex-1">
        <div className="h-16 border-b border-border/40 flex items-center justify-end px-6 gap-2">
          <ModeToggle />
          <form action="/auth/signout" method="post">
            <Button 
              type="submit"
              variant="ghost" 
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Odhlásit se</span>
            </Button>
          </form>
        </div>
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}