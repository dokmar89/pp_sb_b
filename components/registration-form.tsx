"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { registerCompany } from "@/lib/actions/registration"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  companyName: z.string().min(2, "Název společnosti musí mít alespoň 2 znaky"),
  ico: z.string().length(8, "IČO musí mít 8 číslic"),
  dic: z.string().min(10, "DIČ musí mít správný formát").max(12),
  address: z.string().min(5, "Zadejte platnou adresu"),
  email: z.string().email("Zadejte platný email"),
  phone: z.string().min(9, "Zadejte platné telefonní číslo"),
  contactPerson: z.string().min(3, "Zadejte jméno a příjmení"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Musíte souhlasit s podmínkami",
  }),
})

export function RegistrationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      ico: "",
      dic: "",
      address: "",
      email: "",
      phone: "",
      contactPerson: "",
      terms: false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await registerCompany(values)

      if (result.success) {
        toast.success("Žádost o registraci byla úspěšně odeslána")
        form.reset()
      } else {
        toast.error(result.error || "Došlo k chybě při odesílání žádosti")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("Došlo k neočekávané chybě při odesílání žádosti")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Název společnosti</FormLabel>
              <FormControl>
                <Input placeholder="Zadejte název společnosti" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IČO</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
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
                  <Input placeholder="CZ12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sídlo společnosti</FormLabel>
              <FormControl>
                <Input placeholder="Ulice, Město, PSČ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@spolecnost.cz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+420" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kontaktní osoba</FormLabel>
              <FormControl>
                <Input placeholder="Jméno a příjmení" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Souhlasím s obchodními podmínkami a zpracováním osobních údajů</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Odeslat žádost o registraci
        </Button>
      </form>
    </Form>
  )
}

