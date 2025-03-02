// app/test-eshop/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestEshopPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [apiKey, setApiKey] = useState("sk_test_key") // Nahraď svým API klíčem
  const [showVerificationModal, setShowVerificationModal] = useState(true)

  useEffect(() => {
    // Kontrola, zda uživatel již byl ověřen
    const verified = localStorage.getItem('ageVerified') === 'true'
    setIsVerified(verified)
    setShowVerificationModal(!verified)
  }, [])

  const openVerificationWidget = () => {
    const width = 500
    const height = 700
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    const verificationWindow = window.open(
      `${window.location.origin}/widget?apiKey=${apiKey}&mode=modal`,
      'Ověření věku',
      `width=${width},height=${height},top=${top},left=${left}`
    )
    
    if (!verificationWindow) {
      alert("Prohlížeč zablokoval otevření nového okna. Povol vyskakovací okna pro tuto stránku.")
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'VERIFICATION_COMPLETE') {
        console.log('Ověření dokončeno:', event.data.data)
        localStorage.setItem('ageVerified', 'true')
        setIsVerified(true)
        setShowVerificationModal(false)
        verificationWindow.close()
      } else if (event.data.type === 'VERIFICATION_ERROR') {
        console.error('Chyba ověření:', event.data.data.message)
      }
    }

    window.addEventListener('message', handleMessage)
    
    const checkWindowClosed = setInterval(() => {
      if (verificationWindow.closed) {
        window.removeEventListener('message', handleMessage)
        clearInterval(checkWindowClosed)
      }
    }, 1000)
  }

  const resetVerification = () => {
    localStorage.removeItem('ageVerified')
    setIsVerified(false)
    setShowVerificationModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simulace e-shopu */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bohemian Field</h1>
          <div className="flex items-center gap-4">
            {isVerified ? (
              <span className="text-green-600 font-medium">✓ Věk ověřen</span>
            ) : (
              <Button onClick={openVerificationWidget}>Ověřit věk</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-6">
        {isVerified ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Vítejte v našem e-shopu</h2>
            <p className="text-lg">Váš věk byl úspěšně ověřen. Nyní máte přístup k veškerému obsahu.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <CardContent className="p-6">
                    <div className="aspect-square bg-gray-200 mb-4 rounded-md"></div>
                    <h3 className="text-xl font-bold">Produkt {item}</h3>
                    <p className="text-gray-600">Popis produktu</p>
                    <p className="text-xl font-bold mt-2">1 299 Kč</p>
                    <Button className="w-full mt-4">Přidat do košíku</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-8">
              <Button variant="outline" onClick={resetVerification}>
                Reset ověření (pro testování)
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Obsah je skrytý</h2>
            <p className="text-lg mb-6">Pro zobrazení obsahu musíte ověřit svůj věk.</p>
            <Button size="lg" onClick={openVerificationWidget}>
              Ověřit věk
            </Button>
          </div>
        )}
      </main>

      {/* Modální okno pro ověření věku */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Ověření věku</h2>
              <p className="mb-6">
                Pro přístup na tento web musíte být starší 18 let. Prosím, ověřte svůj věk.
              </p>
              <Button className="w-full" onClick={openVerificationWidget}>
                Ověřit věk
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}