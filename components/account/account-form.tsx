"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import type { Tables } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  ico: z.string(),
  dic: z.string(),
  phone: z.string().min(9, "Zadejte platné telefonní číslo"),
  contact_person: z.string(),
})

interface AccountFormProps {
  company: Tables<"companies">
}

export function AccountForm({ company }: AccountFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company.name,
      email: company.email,
      address: company.address,
      ico: company.ico,
      dic: company.dic,
      phone: company.phone,
      contact_person: company.contact_person,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase.from("companies").update(values).eq("id", company.id)

      if (error) throw error

      toast.success("Údaje byly úspěšně aktualizovány")
    } catch (error) {
      console.error("Error updating company:", error)
      toast.error("Došlo k chybě při aktualizaci údajů")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Údaje společnosti</CardTitle>
        <CardDescription>
          Pro změnu údajů kromě telefonního čísla prosím kontaktujte administrátora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název společnosti</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresa</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IČO</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DIČ</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontaktní osoba</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="ml-auto">
          Uložit změny
        </Button>
      </CardFooter>
    </Card>
  )
}

