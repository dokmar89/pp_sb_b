"use client"

import { useState, useEffect } from "react"
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

const formSchema = z.object({
  billing_name: z.string().min(2, "Název musí mít alespoň 2 znaky"),
  billing_address_street: z.string().min(5, "Adresa musí mít alespoň 5 znaků"),
  billing_address_city: z.string().min(2, "Město musí mít alespoň 2 znaky"),
  billing_address_zip: z.string().regex(/^\d{3}\s?\d{2}$/, "PSČ musí být ve formátu XXX XX"),
  billing_country: z.string().min(2, "Země musí mít alespoň 2 znaky"),
  billing_ico: z.string().regex(/^\d{8}$/, "IČO musí být 8 číslic"),
  billing_dic: z.string().regex(/^CZ\d{8}$/, "DIČ musí být ve formátu CZXXXXXXXX"),
})

interface BillingFormProps {
  company: Tables<"companies">
  readOnly?: boolean
}

export function BillingForm({ company, readOnly = false }: BillingFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Načtení fakturačních údajů z databáze
  const [billingInfo, setBillingInfo] = useState<any>(null)
  const [isLoadingBillingInfo, setIsLoadingBillingInfo] = useState(true)

  useEffect(() => {
    async function loadBillingInfo() {
      try {
        setIsLoadingBillingInfo(true)
        const { data, error } = await supabase
          .from("billing_info")
          .select("*")
          .eq("company_id", company.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error loading billing info:", error)
          throw error
        }

        setBillingInfo(data)
      } catch (error) {
        console.error("Failed to load billing info:", error)
      } finally {
        setIsLoadingBillingInfo(false)
      }
    }

    loadBillingInfo()
  }, [company.id])

  // Rozdělení adresy na části, pokud existuje
  const addressParts = billingInfo?.address 
    ? billingInfo.address.split(", ") 
    : company.address 
      ? company.address.split(", ") 
      : ["", "", ""]
      
  const street = addressParts[0] || ""
  const city = addressParts[1] || ""
  const zip = addressParts[2] || ""

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billing_name: billingInfo?.name || company.name || "",
      billing_address_street: street,
      billing_address_city: city,
      billing_address_zip: zip,
      billing_country: "Česká republika",
      billing_ico: billingInfo?.ico || company.ico || "",
      billing_dic: billingInfo?.dic || company.dic || "",
    },
  })

  // Aktualizace formuláře při načtení fakturačních údajů
  useEffect(() => {
    if (billingInfo) {
      const addressParts = billingInfo.address ? billingInfo.address.split(", ") : ["", "", ""]
      const street = addressParts[0] || ""
      const city = addressParts[1] || ""
      const zip = addressParts[2] || ""

      form.reset({
        billing_name: billingInfo.name || company.name || "",
        billing_address_street: street,
        billing_address_city: city,
        billing_address_zip: zip,
        billing_country: "Česká republika",
        billing_ico: billingInfo.ico || company.ico || "",
        billing_dic: billingInfo.dic || company.dic || "",
      })
    }
  }, [billingInfo, company, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      // Spojení adresy do jednoho řetězce
      const combinedAddress = `${values.billing_address_street}, ${values.billing_address_city}, ${values.billing_address_zip}`
      
      console.log("Saving billing info:", {
        name: values.billing_name,
        address: combinedAddress,
        ico: values.billing_ico,
        dic: values.billing_dic,
      })
      
      // Pokud již existují fakturační údaje, aktualizujeme je
      if (billingInfo) {
        const { data, error } = await supabase
          .from("billing_info")
          .update({
            name: values.billing_name,
            address: combinedAddress,
            ico: values.billing_ico,
            dic: values.billing_dic,
          })
          .eq("id", billingInfo.id)
          .select()

        if (error) {
          console.error("Error details:", error)
          throw error
        }

        console.log("Update successful:", data)
      } 
      // Jinak vytvoříme nový záznam
      else {
        const { data, error } = await supabase
          .from("billing_info")
          .insert({
            company_id: company.id,
            name: values.billing_name,
            address: combinedAddress,
            ico: values.billing_ico,
            dic: values.billing_dic,
          })
          .select()

        if (error) {
          console.error("Error details:", error)
          throw error
        }

        console.log("Insert successful:", data)
      }
      
      // Reload the page to reflect the changes
      window.location.reload()
      
      toast.success("Fakturační údaje byly úspěšně aktualizovány")
    } catch (error) {
      console.error("Error updating billing info:", error)
      toast.error("Nepodařilo se aktualizovat fakturační údaje")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fakturační údaje</CardTitle>
        <CardDescription>
          Tyto údaje budou použity na fakturách, které vám budou vystaveny
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="billing_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název společnosti</FormLabel>
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
                name="billing_ico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IČO</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_dic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DIČ</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="billing_address_street"
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
                name="billing_address_city"
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
                name="billing_address_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSČ</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} placeholder="XXX XX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="billing_country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Země</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!readOnly && (
              <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Uložit změny
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}