import type { Metadata } from "next"
import Link from "next/link"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Zapomenuté heslo",
  description: "Obnovení zapomenutého hesla",
}

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Zapomenuté heslo</h1>
          <p className="text-sm text-muted-foreground">
            Zadejte svůj email a my vám pošleme instrukce k obnovení hesla
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:text-brand underline underline-offset-4">
            Zpět na přihlášení
          </Link>
        </p>
      </div>
    </div>
  )
}

