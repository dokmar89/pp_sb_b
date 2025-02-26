"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"

const formSchema = z.object({
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
})

interface LoginFormProps {
  redirect?: string
}

export function LoginForm({ redirect = "/dashboard" }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log("User is authenticated, redirecting...")
        await router.replace(redirect)
      }
    }
    checkAuth()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setDebugInfo("Začínám přihlašování...")

      // Nejdřív přihlášení
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError) throw authError

      // Pak získáme data společnosti
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("email", values.email)
        .single()

      if (companyError) {
        console.error("Company error:", companyError)
        throw new Error("Nepodařilo se načíst data společnosti")
      }

      if (company.status !== "approved") {
        throw new Error("Vaše registrace zatím nebyla schválena")
      }

      console.log("Auth successful:", authData)
      console.log("Company data:", company)

      // Přesměrování na dashboard
      router.push(redirect || '/dashboard')
      
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Přihlášení se nezdařilo")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jmeno@firma.cz"
                {...form.register("email")}
                className="mt-1.5"
                autoComplete="email"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1.5">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="mt-1.5"
                autoComplete="current-password"
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1.5">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="link"
                className="px-0 font-normal"
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
              >
                Zapomenuté heslo?
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Přihlašování...
              </>
            ) : (
              "Přihlásit se"
            )}
          </Button>
        </form>

        {process.env.NODE_ENV === "development" && debugInfo && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap break-all bg-muted p-2 rounded">
              {debugInfo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

