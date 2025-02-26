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
}

export function OtherDeviceStep({ onBack, apiKey, customization }: Props) {
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (apiKey && !qrCodeData) {
      const verificationUrl = `${window.location.origin}/verify/preview-${Date.now()}?apiKey=${apiKey}`
      setQrCodeData(verificationUrl)
    }
  }, [apiKey, qrCodeData])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setVerificationComplete(true)
          setIsVerified(true)
          return 100
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(progressInterval)
  }, [])

  if (isVerified) {
    return <VerificationResult isVerified={true} method="other_device" apiKey={apiKey} customization={customization} />
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
            {qrCodeData && <QRCodeSVG value={qrCodeData} size={256} level="H" fgColor={customization?.primary_color} />}
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

