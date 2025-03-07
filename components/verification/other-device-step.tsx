"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { VerificationResult } from "./verification-result"

interface Props {
  onBack: () => void
  apiKey: string | null
  customization?: {
    primary_color: string
    secondary_color: string
    button_style: string
  }
  sessionId?: string
  onComplete?: (result: any) => void
  onError?: (error: Error) => void
}

export function OtherDeviceStep({ onBack, apiKey, customization, sessionId, onComplete, onError }: Props) {
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingIntervalState] = useState<NodeJS.Timeout | null>(null)

  // Create a session when component mounts
  useEffect(() => {
    async function createSession() {
      try {
        if (!sessionId) {
          const response = await fetch("/api/verify/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shop_id: apiKey,
            }),
          })

          if (!response.ok) {
            throw new Error("Nepodařilo se vytvořit session")
          }

          const data = await response.json()
          const verificationUrl = `${window.location.origin}/verify/${data.session_id}?apiKey=${apiKey}`
          setQrCodeData(verificationUrl)
        }
      } catch (err) {
        console.error("Error creating session:", err)
        setError("Nepodařilo se vytvořit session pro ověření")
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    if (apiKey && !qrCodeData && !sessionId) {
      createSession()
    }
  }, [apiKey, qrCodeData, sessionId, onError])

  // If we have a sessionId, we're on the mobile device that scanned the QR code
  // No need to show QR code again
  useEffect(() => {
    if (sessionId) {
      setQrCodeData("SESSION_CONNECTED")
    }
  }, [sessionId])

  // Poll for session status if we're the originator (showing QR code)
  useEffect(() => {
    if (!sessionId && qrCodeData && qrCodeData !== "SESSION_CONNECTED") {
      // Extract session ID from QR code URL
      const url = new URL(qrCodeData)
      const pathParts = url.pathname.split('/')
      const extractedSessionId = pathParts[pathParts.length - 1]

      // Start polling for session status
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/verify/session?session_id=${extractedSessionId}`)
          if (!response.ok) {
            throw new Error("Nepodařilo se získat stav session")
          }

          const data = await response.json()
          
          // If session has a verification ID and is completed, verification is done
          if (data.verification_id && data.status === "completed") {
            clearInterval(interval)
            setVerificationComplete(true)
            setIsVerified(true)
            setProgress(100)
            
            // Call onComplete callback
            if (onComplete) {
              onComplete({
                success: true,
                verificationId: data.verification_id,
                method: "other_device",
                timestamp: new Date().toISOString()
              })
            }
          }
        } catch (err) {
          console.error("Error polling session:", err)
        }
      }, 2000) // Poll every 2 seconds
      
      setPollingIntervalState(interval)
      
      return () => {
        clearInterval(interval)
      }
    }
  }, [qrCodeData, sessionId, onComplete])

  // Cleanup polling interval
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Show progress bar animation
  useEffect(() => {
    // Only show progress animation if we're not polling for real status
    if (!qrCodeData || qrCodeData === "SESSION_CONNECTED") {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 1
        })
      }, 100)

      return () => clearInterval(progressInterval)
    }
  }, [qrCodeData])

  if (isVerified) {
    return <VerificationResult isVerified={true} method="other_device" apiKey={apiKey} customization={customization} />
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization?.primary_color }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-500">
              Chyba
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              style={{ 
                backgroundColor: customization?.primary_color,
                color: customization?.secondary_color
              }}
            >
              Zkusit znovu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we have a sessionId, we're on the mobile device that scanned the QR code
  if (sessionId) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
              Ověření připojeno
            </h2>
            <p className="text-gray-600 mb-6">
              Vaše zařízení bylo úspěšně připojeno k ověření. Pokračujte výběrem metody ověření.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization?.primary_color }}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
      </Button>
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Ověření na jiném zařízení
          </h2>
          <p className="text-gray-600 mb-6">
            Naskenujte QR kód pomocí svého mobilního zařízení a dokončete proces ověření.
          </p>
          <div className="flex justify-center mb-6">
            {qrCodeData && qrCodeData !== "SESSION_CONNECTED" && (
              <QRCodeSVG value={qrCodeData} size={256} level="H" fgColor={customization?.primary_color} />
            )}
          </div>
          {!verificationComplete && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: customization?.primary_color,
                }}
              />
            </div>
          )}
          {verificationComplete && (
            <p className="text-center text-green-600 font-semibold mt-4">
              Ověření bylo úspěšně dokončeno na jiném zařízení.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

