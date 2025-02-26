"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { createTicket } from "@/lib/actions/support"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  subject: z.string().min(5, "Předmět musí mít alespoň 5 znaků"),
  description: z.string().min(20, "Popis musí mít alespoň 20 znaků"),
  priority: z.enum(["low", "medium", "high"]),
})

const priorities = [
  { value: "low", label: "Nízká" },
  { value: "medium", label: "Střední" },
  { value: "high", label: "Vysoká" },
]

export function CreateTicketDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createTicket(values)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Ticket byl úspěšně vytvořen")
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Došlo k chybě při vytváření ticketu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nový ticket</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vytvořit nový ticket</DialogTitle>
          <DialogDescription>Popište váš problém a my se vám co nejdříve ozveme</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Předmět</FormLabel>
                  <FormControl>
                    <Input placeholder="Krátký popis problému" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailní popis problému..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorita</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte prioritu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Vytvořit ticket
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

