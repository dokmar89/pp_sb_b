import type { Metadata } from "next"

import { RegistrationSteps } from "@/components/auth/registration-steps"

export const metadata: Metadata = {
  title: "Registrace",
  description: "Registrace nové společnosti",
}

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Registrace společnosti</h1>
          <p className="text-sm text-muted-foreground">Vytvořte si účet pro přístup k věkové verifikaci</p>
        </div>
        <RegistrationSteps />
      </div>
    </div>
  )
}

