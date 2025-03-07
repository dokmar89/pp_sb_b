"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { WidgetVerification } from "@/components/widget/widget-verification"
import { Loader2 } from "lucide-react"

export default function VerifyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.session_id as string
  const apiKey = searchParams.get("apiKey")
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shopId, setShopId] = useState<string | null>(null)
  const [customization, setCustomization] = useState<any>(null)

  useEffect(() => {
    async function fetchSessionData() {
      try {
        // Fetch session data
        const sessionResponse = await fetch(`/api/verify/session?session_id=${sessionId}`)
        if (!sessionResponse.ok) {
          throw new Error("Nepodařilo se načíst data session")
        }
        
        const sessionData = await sessionResponse.json()
        
        // Fetch shop data and customization
        const shopResponse = await fetch(`/api/shops/${sessionData.shop_id}`)
        if (!shopResponse.ok) {
          throw new Error("Nepodařilo se načíst data obchodu")
        }
        
        const shopData = await shopResponse.json()
        setShopId(shopData.id)
        
        // Fetch customization
        const customizationResponse = await fetch(`/api/shops/${shopData.id}/customization`)
        if (customizationResponse.ok) {
          const customizationData = await customizationResponse.json()
          setCustomization(customizationData)
        } else {
          // Use default customization
          setCustomization({
            primary_color: "#4f46e5",
            secondary_color: "#ffffff",
            button_style: "rounded",
            verification_methods: ["facescan", "ocr", "bankid", "mojeid", "revalidate", "other_device"],
            texts: {
              title: "Ověření věku",
              subtitle: "Vyberte způsob ověření věku"
            }
          })
        }
        
        setLoading(false)
      } catch (err) {
        console.error("Error fetching session data:", err)
        setError("Nepodařilo se načíst data. Zkontrolujte QR kód a zkuste to znovu.")
        setLoading(false)
      }
    }
    
    fetchSessionData()
  }, [sessionId])

  // Handle verification completion
  const handleVerificationComplete = async (result: any) => {
    if (result.success && result.verificationId) {
      try {
        // Update session with verification ID
        await fetch("/api/verify/session", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            verification_id: result.verificationId,
            status: "completed"
          }),
        })
      } catch (err) {
        console.error("Error updating session:", err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Načítání...</h2>
          <p className="text-muted-foreground">Připravujeme ověření</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Chyba</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (!shopId || !customization) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500">Neplatná session</h2>
          <p className="text-muted-foreground">Zkuste naskenovat QR kód znovu</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <WidgetVerification 
        shopId={shopId} 
        apiKey={apiKey || ""} 
        mode="embedded" 
        customization={customization}
        sessionId={sessionId}
        onComplete={handleVerificationComplete}
      />
    </div>
  )
} 