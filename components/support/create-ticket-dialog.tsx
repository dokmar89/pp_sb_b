"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
  shop_id: z.string().optional(),
  category: z.string().min(1, "Vyberte kategorii problému"),
})

const priorities = [
  { value: "low", label: "Nízká" },
  { value: "medium", label: "Střední" },
  { value: "high", label: "Vysoká" },
]

const categories = [
  { value: "technical", label: "Technický problém" },
  { value: "billing", label: "Fakturace" },
  { value: "integration", label: "Integrace" },
  { value: "other", label: "Ostatní" },
]

export function CreateTicketDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [shops, setShops] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchShops() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!company) return
      
      const { data: shopsList } = await supabase
        .from("shops")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name")
      
      if (shopsList) {
        setShops(shopsList)
      }
    }
    
    if (open) {
      fetchShops()
    }
  }, [open, supabase])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
      shop_id: undefined,
      category: "",
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
      router.refresh() // Aktualizace seznamu ticketů
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-shop</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte e-shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie problému</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte kategorii" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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