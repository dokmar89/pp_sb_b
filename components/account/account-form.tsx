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
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useState } from "react"

const formSchema = z.object({
  name: z.string().min(1, "Název společnosti je povinný"),
  email: z.string().email("Zadejte platný email"),
  street: z.string().min(1, "Ulice je povinná"),
  city: z.string().min(1, "Město je povinné"),
  postalCode: z.string().min(5, "PSČ musí mít alespoň 5 znaků"),
  ico: z.string().min(1, "IČO je povinné"),
  dic: z.string().min(1, "DIČ je povinné"),
  phone: z.string().min(9, "Zadejte platné telefonní číslo"),
  contact_person: z.string().min(1, "Kontaktní osoba je povinná"),
})

interface AccountFormProps {
  company: Tables<"companies">
  readOnly?: boolean
}

export function AccountForm({ company, readOnly = false }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Split the address into street, city, and postal code
  const addressParts = company.address ? company.address.split(', ') : ['', '', '']
  const [street, city, postalCode] = addressParts.length >= 3 
    ? addressParts 
    : [...addressParts, ...Array(3 - addressParts.length).fill('')]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company.name,
      email: company.email,
      street: street,
      city: city,
      postalCode: postalCode,
      ico: company.ico,
      dic: company.dic,
      phone: company.phone,
      contact_person: company.contact_person,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      // Combine street, city, and postal code into a single address string
      const combinedAddress = `${values.street}, ${values.city}, ${values.postalCode}`
      console.log("Saving address:", combinedAddress)
      
      const { data, error } = await supabase
        .from("companies")
        .update({
          address: combinedAddress,
          phone: values.phone,
          contact_person: values.contact_person,
        })
        .eq("id", company.id)
        .select()

      if (error) {
        console.error("Error updating company:", error)
        throw error
      }
      
      console.log("Update successful:", data)
      
      // Reload the page to reflect the changes
      window.location.reload()
      
      toast.success("Údaje společnosti byly úspěšně aktualizovány")
    } catch (error) {
      console.error("Error updating company:", error)
      toast.error("Nepodařilo se aktualizovat údaje společnosti")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Údaje společnosti</CardTitle>
        <CardDescription>
          Základní informace o vaší společnosti. Pro změnu názvu, IČO, DIČ nebo emailu kontaktujte podporu.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název společnosti</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} />
                  </FormControl>
                  <FormMessage />
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
                    <Input {...field} type="email" disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ulice a číslo popisné</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Město</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSČ</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IČO</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={true} />
                    </FormControl>
                    <FormMessage />
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
                      <Input {...field} disabled={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" disabled={readOnly} />
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
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            {!readOnly && (
              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isDirty}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Uložit změny
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
