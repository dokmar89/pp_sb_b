"use client"

import { format } from "date-fns"
import { cs } from "date-fns/locale"

import { updateTicketStatus } from "@/lib/actions/support"
import type { Tables } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface TicketDetailProps {
  ticket: Tables<"support_tickets">
}

const statuses = [
  { value: "open", label: "Otevřený" },
  { value: "in_progress", label: "V řešení" },
  { value: "resolved", label: "Vyřešený" },
  { value: "closed", label: "Uzavřený" },
]

const priorities = {
  low: { label: "Nízká", variant: "outline" as const },
  medium: { label: "Střední", variant: "default" as const },
  high: { label: "Vysoká", variant: "destructive" as const },
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  const handleStatusChange = async (status: string) => {
    try {
      const result = await updateTicketStatus(ticket.id, status as "open" | "in_progress" | "resolved" | "closed")

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Status ticketu byl aktualizován")
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast.error("Došlo k chybě při aktualizaci statusu")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail ticketu</CardTitle>
        <CardDescription>Informace o ticketu a jeho stavu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vytvořeno</div>
            <div>
              {format(new Date(ticket.created_at), "Pp", {
                locale: cs,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Poslední aktualizace</div>
            <div>
              {format(new Date(ticket.updated_at), "Pp", {
                locale: cs,
              })}
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Priorita</div>
          <div>
            <Badge variant={priorities[ticket.priority].variant}>{priorities[ticket.priority].label}</Badge>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Popis</div>
          <div className="mt-1 whitespace-pre-wrap">{ticket.description}</div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between">
          <div className="text-sm text-muted-foreground">Status</div>
          <Select defaultValue={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardFooter>
    </Card>
  )
}

