"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const steps = [
  { id: "api", title: "API", description: "Vlastní implementace pomocí REST API" },
  { id: "widget", title: "Widget", description: "Jednoduchá integrace pomocí JavaScript widgetu" },
  { id: "plugin", title: "Plugin", description: "Hotové řešení pro váš e-shop" },
]

export function InstallationTabs() {
  const [activeTab, setActiveTab] = useState("api")

  return (
    <div className="space-y-4">
      <nav className="flex space-x-2" aria-label="Tabs">
        {steps.map((step) => (
          <Button
            key={step.id}
            variant={activeTab === step.id ? "default" : "outline"}
            className={cn(
              "flex-1",
              activeTab === step.id &&
                "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            )}
            onClick={() => setActiveTab(step.id)}
          >
            {step.title}
          </Button>
        ))}
      </nav>
      <div className="rounded-lg border bg-card p-6">
        {activeTab === "api" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">REST API Integrace</h2>
            <p className="text-muted-foreground">
              Implementujte věkovou verifikaci pomocí našeho REST API. Toto řešení nabízí největší flexibilitu a
              kontrolu nad procesem verifikace.
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">Výhody:</h3>
              <ul className="space-y-1">
                {[
                  "Plná kontrola nad implementací",
                  "Možnost vlastního UI",
                  "Podpora všech verifikačních metod",
                  "Serverová integrace",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {activeTab === "widget" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">JavaScript Widget</h2>
            <p className="text-muted-foreground">
              Nejrychlejší způsob implementace. Stačí vložit náš JavaScript kód a widget se postará o zbytek.
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">Výhody:</h3>
              <ul className="space-y-1">
                {[
                  "Rychlá implementace",
                  "Žádné složité nastavení",
                  "Automatické aktualizace",
                  "Responzivní design",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {activeTab === "plugin" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Plugin pro e-shop</h2>
            <p className="text-muted-foreground">
              Máte-li e-shop na některé z podporovaných platforem, můžete využít náš připravený plugin.
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">Podporované platformy:</h3>
              <ul className="space-y-1">
                {["Shoptet", "WooCommerce", "PrestaShop", "Shopify"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

