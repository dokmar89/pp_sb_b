import Link from "next/link"
import { CheckCircle, Shield, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DemoVerificationDialog } from "@/components/verification/demo-verification-dialog"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-semibold">Věková verifikace</div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Přihlášení</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrace</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="container space-y-6 py-24 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Ověření věku pro váš e-shop</h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground">
            Jednoduché a spolehlivé řešení pro ověření věku vašich zákazníků. Integrujte během několika minut a zvyšte
            bezpečnost vašeho podnikání.
          </p>
          <div className="flex justify-center gap-4">
            <DemoVerificationDialog />
            <Link href="/auth/register">
              <Button variant="outline" size="lg">
                Registrovat se
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="container py-24">
            <div className="grid gap-12 sm:grid-cols-3">
              <div className="space-y-4 text-center">
                <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Bezpečné ověření</h3>
                <p className="text-muted-foreground">Využíváme moderní metody ověření včetně BankID a MojeID</p>
              </div>
              <div className="space-y-4 text-center">
                <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Rychlá integrace</h3>
                <p className="text-muted-foreground">
                  Implementace během několika minut pomocí našeho API nebo widgetu
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 text-primary">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Spolehlivý systém</h3>
                <p className="text-muted-foreground">Garantujeme vysokou dostupnost a technickou podporu</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-auto border-t">
        <div className="container flex h-16 items-center justify-between">
          <div className="text-sm text-muted-foreground">© 2024 Věková verifikace. Všechna práva vyhrazena.</div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Podmínky
            </Link>
            <Link href="#" className="hover:text-foreground">
              Ochrana soukromí
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

