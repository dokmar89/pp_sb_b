"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const apiExample = `// 1. Inicializace verifikace
const response = await fetch('https://api.ageverification.cz/v1/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    method: 'bankid',
    redirect_url: 'https://vas-eshop.cz/callback'
  })
})

const { verification_id, verification_url } = await response.json()

// 2. Přesměrování na verifikaci
window.location.href = verification_url

// 3. Callback handler
app.post('/callback', async (req, res) => {
  const { verification_id, status } = req.body
  
  if (status === 'success') {
    // Verifikace úspěšná
  } else {
    // Verifikace neúspěšná
  }
})`

const widgetExample = `<!-- 1. Vložení skriptu -->
<script src="https://cdn.ageverification.cz/widget.js"></script>

<!-- 2. Přidání containeru -->
<div id="age-verification"></div>

<!-- 3. Inicializace widgetu -->
<script>
  AgeVerification.init({
    apiKey: 'YOUR_API_KEY',
    container: '#age-verification',
    onVerified: (result) => {
      if (result.status === 'success') {
        // Verifikace úspěšná
      } else {
        // Verifikace neúspěšná
      }
    }
  })
</script>`

const pluginExample = `// Shoptet
1. Přejděte do administrace vašeho e-shopu
2. Otevřete sekci "Doplňky"
3. Vyhledejte "Věková verifikace"
4. Klikněte na "Instalovat"
5. Zadejte váš API klíč
6. Uložte nastavení

// WooCommerce
1. V administraci WP přejděte do Pluginy > Přidat nový
2. Vyhledejte "Věková verifikace"
3. Klikněte na "Instalovat" a poté "Aktivovat"
4. V nastavení pluginu zadejte váš API klíč
5. Uložte změny`

export function InstallationGuide() {
  const [activeTab, setActiveTab] = useState("api")

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Kód byl zkopírován do schránky")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Implementační příručka</CardTitle>
        <CardDescription>Podrobný návod k implementaci věkové verifikace</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">REST API</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="plugin">Plugin</TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Ukázkový kód</div>
                <Button variant="ghost" size="icon" onClick={() => copyCode(apiExample)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm">{apiExample}</pre>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Postup implementace:</h3>
              <ol className="list-decimal space-y-2 pl-4">
                <li>Získejte API klíč z dashboardu (Sekce Eshopy {">"} Detail eshopu)</li>
                <li>Implementujte endpoint pro zpracování callback notifikací</li>
                <li>Otestujte implementaci v testovacím prostředí</li>
                <li>Po úspěšném otestování přepněte do produkčního režimu</li>
              </ol>
            </div>
          </TabsContent>
          <TabsContent value="widget" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Ukázkový kód</div>
                <Button variant="ghost" size="icon" onClick={() => copyCode(widgetExample)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm">{widgetExample}</pre>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Postup implementace:</h3>
              <ol className="list-decimal space-y-2 pl-4">
                <li>Vložte skript do hlavičky vašeho webu</li>
                <li>Přidejte container pro widget</li>
                <li>Inicializujte widget s vaším API klíčem</li>
                <li>Otestujte funkčnost verifikace</li>
              </ol>
            </div>
          </TabsContent>
          <TabsContent value="plugin" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Postup instalace</div>
                <Button variant="ghost" size="icon" onClick={() => copyCode(pluginExample)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm">{pluginExample}</pre>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Podporované verze:</h3>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Shoptet - všechny verze</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>WooCommerce 5.0+</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>PrestaShop 1.7+</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Shopify - všechny verze</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open("https://docs.ageverification.cz", "_blank")}
        >
          Kompletní dokumentace
        </Button>
      </CardFooter>
    </Card>
  )
}

