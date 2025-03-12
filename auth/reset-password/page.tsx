import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset hesla",
  description: "Nastavení nového hesla",
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Nastavení nového hesla</h1>
          <p className="text-sm text-muted-foreground">Zadejte své nové heslo</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}

