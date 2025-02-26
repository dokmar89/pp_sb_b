"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { addMessage } from "@/lib/actions/support"
import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface TicketMessagesProps {
  ticketId: string
  initialMessages: Tables<"support_messages">[]
}

const formSchema = z.object({
  message: z.string().min(1, "Zpráva nemůže být prázdná"),
})

export function TicketMessages({ ticketId, initialMessages }: TicketMessagesProps) {
  const [messages, setMessages] = useState<Tables<"support_messages">[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Tables<"support_messages">])
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [ticketId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await addMessage({
        ticketId,
        message: values.message,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      form.reset()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Došlo k chybě při odesílání zprávy")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komunikace</CardTitle>
        <CardDescription>Historie komunikace k ticketu</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">Zatím žádné zprávy</div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg p-4",
                    message.is_staff ? "ml-6 bg-primary/10" : "mr-6 bg-muted/50",
                  )}
                >
                  <div className="text-sm text-muted-foreground">
                    {message.is_staff ? "Podpora" : "Vy"} •{" "}
                    {format(new Date(message.created_at), "Pp", {
                      locale: cs,
                    })}
                  </div>
                  <div className="whitespace-pre-wrap">{message.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full gap-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea placeholder="Napište zprávu..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="self-end">
              Odeslat
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  )
}

