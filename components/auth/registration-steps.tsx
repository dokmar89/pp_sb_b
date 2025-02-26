"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { registerCompany } from "@/lib/actions/registration"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const companySchema = z.object({
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

const passwordSchema = z
  .object({
    password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hesla se neshodují",
    path: ["confirmPassword"],
  })

type CompanyData = z.infer<typeof companySchema>
type PasswordData = z.infer<typeof passwordSchema>

export function RegistrationSteps() {
  const [step, setStep] = useState(1)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const router = useRouter()

  const companyForm = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
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

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onCompanySubmit(data: CompanyData) {
    setCompanyData(data)
    setStep(2)
  }

  async function onPasswordSubmit(data: PasswordData) {
    try {
      if (!companyData) return

      const result = await registerCompany({
        ...companyData,
        password: data.password,
      })

      if (result.success) {
        toast.success("Žádost o registraci byla odeslána. Po schválení vám přijde email.")
        router.push("/auth/login")
      } else {
        toast.error(result.error || "Došlo k chybě při registraci")
        setStep(1)
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Došlo k neočekávané chybě")
      setStep(1)
    }
  }

  if (step === 1) {
    return (
      <Form {...companyForm}>
        <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
          <FormField
            control={companyForm.control}
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
              control={companyForm.control}
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
              control={companyForm.control}
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
            control={companyForm.control}
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
              control={companyForm.control}
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
              control={companyForm.control}
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
            control={companyForm.control}
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
            control={companyForm.control}
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
            Pokračovat
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nastavení hesla</CardTitle>
        <CardDescription>Zvolte si heslo pro přístup do systému</CardDescription>
      </CardHeader>
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potvrzení hesla</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Zpět
            </Button>
            <Button type="submit">Dokončit registraci</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

