"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function TicketsList() {
  const [tickets, setTickets] = useState<Tables<"support_tickets">[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setTickets(data || [])
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("tickets_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTickets((current) => [payload.new as Tables<"support_tickets">, ...current])
        } else if (payload.eventType === "UPDATE") {
          setTickets((current) =>
            current.map((ticket) =>
              ticket.id === payload.new.id ? (payload.new as Tables<"support_tickets">) : ticket,
            ),
          )
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary">Otevřený</Badge>
      case "in_progress":
        return <Badge variant="default">V řešení</Badge>
      case "resolved":
        return <Badge variant="success">Vyřešený</Badge>
      case "closed":
        return <Badge variant="outline">Uzavřený</Badge>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline">Nízká</Badge>
      case "medium":
        return <Badge variant="default">Střední</Badge>
      case "high":
        return <Badge variant="destructive">Vysoká</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Předmět</TableHead>
              <TableHead>Priorita</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vytvořeno</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-5 w-40 animate-pulse rounded bg-muted"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-32 animate-pulse rounded bg-muted"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Předmět</TableHead>
            <TableHead>Priorita</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vytvořeno</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Žádné tickety k zobrazení
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>
                  {format(new Date(ticket.created_at), "Pp", {
                    locale: cs,
                  })}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="float-right" asChild>
                    <Link href={`/dashboard/support/${ticket.id}`}>
                      Detail
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}