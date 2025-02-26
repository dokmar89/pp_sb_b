import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Přihlášení",
  description: "Přihlášení do systému věkové verifikace",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Vítejte zpět
          </h1>
          <p className="text-muted-foreground mt-2">
            Přihlaste se do svého účtu
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link href="/auth/forgot-password" className="hover:text-brand underline underline-offset-4">
            Zapomenuté heslo?
          </Link>
        </p>
      </div>
    </div>
  )
}

