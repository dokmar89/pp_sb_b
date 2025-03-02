// app/test-widget/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestWidgetPage() {
  const [apiKey, setApiKey] = useState("")
  const [widgetUrl, setWidgetUrl] = useState("")
  const [verificationResult, setVerificationResult] = useState<any>(null)

  useEffect(() => {
    // Nastav výchozí hodnotu widgetUrl na localhost
    setWidgetUrl(window.location.origin)
  }, [])

  const openVerificationWidget = () => {
    if (!apiKey) {
      alert("Zadej API klíč!")
      return
    }

    const width = 500
    const height = 700
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    // Otevři widget v novém okně
    const verificationWindow = window.open(
      `${widgetUrl}/widget?apiKey=${apiKey}&mode=modal`,
      'Ověření věku',
      `width=${width},height=${height},top=${top},left=${left}`
    )
    
    if (!verificationWindow) {
      alert("Prohlížeč zablokoval otevření nového okna. Povol vyskakovací okna pro tuto stránku.")
      return
    }

    // Poslouchej zprávy z widgetu
    const handleMessage = (event: MessageEvent) => {
      // Ověř, že zpráva pochází z našeho widgetu
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'VERIFICATION_COMPLETE') {
        console.log('Ověření dokončeno:', event.data.data)
        setVerificationResult(event.data.data)
        verificationWindow.close()
      } else if (event.data.type === 'VERIFICATION_ERROR') {
        console.error('Chyba ověření:', event.data.data.message)
        alert(`Chyba ověření: ${event.data.data.message}`)
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Odstraň posluchač, když se okno zavře
    const checkWindowClosed = setInterval(() => {
      if (verificationWindow.closed) {
        window.removeEventListener('message', handleMessage)
        clearInterval(checkWindowClosed)
      }
    }, 1000)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test ověřovacího widgetu</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nastavení widgetu</CardTitle>
            <CardDescription>
              Zadej API klíč tvého e-shopu pro testování ověřovacího widgetu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API klíč</Label>
                <Input
                  id="apiKey"
                  placeholder="sk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="widgetUrl">URL widgetu (výchozí je localhost)</Label>
                <Input
                  id="widgetUrl"
                  placeholder="http://localhost:3000"
                  value={widgetUrl}
                  onChange={(e) => setWidgetUrl(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={openVerificationWidget}
              >
                Otevřít ověřovací widget
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Výsledek ověření</CardTitle>
            <CardDescription>
              Zde se zobrazí výsledek ověření po jeho dokončení
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationResult ? (
              <pre className="bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(verificationResult, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">Zatím neproběhlo žádné ověření</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}