import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

import { CreateTicketDialog } from "@/components/support/create-ticket-dialog"
import { TicketsList } from "@/components/support/tickets-list"

export default async function SupportPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Podpora</h1>
            <p className="text-muted-foreground">Centrum podpory a nápovědy</p>
          </div>
          <CreateTicketDialog />
        </div>
        <TicketsList />
      </div>
    </div>
  )
}