"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(2, "Název musí mít alespoň 2 znaky"),
  ico: z.string().min(8, "IČO musí mít 8 znaků"),
  street: z.string().min(2, "Ulice musí mít alespoň 2 znaky"),
  city: z.string().min(2, "Město musí mít alespoň 2 znaky"),
  postalCode: z.string().min(5, "PSČ musí mít 5 znaků"),
})

function parseAddress(fullAddress: string) {
  // Očekávaný formát: "Ulice 123, Město, PSČ"
  const parts = fullAddress.split(',').map(part => part.trim())
  
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    postalCode: parts[2] || ''
  }
}

function combineAddress(street: string, city: string, postalCode: string) {
  return `${street}, ${city}, ${postalCode}`
}

export function CompanyDetails({ companyId }: { companyId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ico: "",
      street: "",
      city: "",
      postalCode: "",
    },
  })

  useEffect(() => {
    async function loadCompanyDetails() {
      try {
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single()

        if (error) throw error

        if (company) {
          const { street, city, postalCode } = parseAddress(company.address)
          
          form.reset({
            name: company.name,
            ico: company.ico,
            street,
            city,
            postalCode,
          })
        }
      } catch (error) {
        console.error("Error loading company details:", error)
        toast.error("Nepodařilo se načíst údaje o společnosti")
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanyDetails()
  }, [companyId, form, supabase])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      const { error } = await supabase
        .from("companies")
        .update({
          name: values.name,
          ico: values.ico,
          address: combineAddress(values.street, values.city, values.postalCode)
        })
        .eq("id", companyId)

      if (error) throw error

      toast.success("Údaje byly úspěšně aktualizovány")
    } catch (error) {
      console.error("Error updating company details:", error)
      toast.error("Nepodařilo se aktualizovat údaje")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Název společnosti</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IČO</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ulice a číslo popisné</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Město</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PSČ</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Ukládám..." : "Uložit změny"}
        </Button>
      </form>
    </Form>
  )
} 