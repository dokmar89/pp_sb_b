import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound, redirect } from "next/navigation"

import { TicketDetail } from "@/components/support/ticket-detail"
import { TicketMessages } from "@/components/support/ticket-messages"

interface TicketPageProps {
  params: {
    ticketId: string
  }
}

export default async function TicketPage({ params }: TicketPageProps) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Fetch ticket data
  const { data: ticket, error } = await supabase.from("support_tickets").select("*").eq("id", params.ticketId).single()

  if (error || !ticket) {
    notFound()
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ticket #{ticket.id.slice(0, 8)}</h1>
        <p className="text-muted-foreground">{ticket.subject}</p>
      </div>
      <div className="grid gap-6">
        <TicketDetail ticket={ticket} />
        <TicketMessages ticketId={ticket.id} initialMessages={messages || []} />
      </div>
    </div>
  )
}