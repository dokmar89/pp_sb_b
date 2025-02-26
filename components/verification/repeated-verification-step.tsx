"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Phone, Mail, Apple, Chrome } from "lucide-react"
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

export function RepeatedVerificationStep({ onBack, apiKey, customization }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [phoneOrEmail, setPhoneOrEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
  }

  const handleSendCode = async () => {
    setIsSendingCode(true)
    // Simulace odeslání kódu pro náhled
    setTimeout(() => {
      setIsSendingCode(false)
      setCodeSent(true)
    }, 2000)
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    // Simulace ověření pro náhled
    setTimeout(() => {
      setIsVerifying(false)
      setIsVerified(true)
    }, 2000)
  }

  if (isVerified) {
    return <VerificationResult isVerified={true} method="revalidate" apiKey={apiKey} customization={customization} />
  }

  return (
    <div className="max-w-md mx-auto">
      {!selectedMethod && (
        <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization?.primary_color }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>
      )}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          {selectedMethod && (
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedMethod(null)}
              style={{ color: customization?.primary_color }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
            </Button>
          )}
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Opakované ověření
          </h2>
          {!selectedMethod ? (
            <div className="space-y-4">
              {["phone", "email", "apple", "google"].map((method) => (
                <Button
                  key={method}
                  variant="outline"
                  className="w-full"
                  onClick={() => handleMethodSelect(method)}
                  style={{
                    borderColor: customization?.primary_color,
                    color: customization?.primary_color,
                    borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  {method === "phone" && <Phone className="mr-2 h-4 w-4" />}
                  {method === "email" && <Mail className="mr-2 h-4 w-4" />}
                  {method === "apple" && <Apple className="mr-2 h-4 w-4" />}
                  {method === "google" && <Chrome className="mr-2 h-4 w-4" />}
                  {method === "phone" && "Telefon"}
                  {method === "email" && "Email"}
                  {method === "apple" && "Apple"}
                  {method === "google" && "Google"}
                </Button>
              ))}
            </div>
          ) : selectedMethod === "phone" || selectedMethod === "email" ? (
            <div className="space-y-4">
              <Input
                type={selectedMethod === "phone" ? "tel" : "email"}
                placeholder={selectedMethod === "phone" ? "Zadejte telefonní číslo" : "Zadejte email"}
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                disabled={isSendingCode}
              />
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={!phoneOrEmail || codeSent || isSendingCode}
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {isSendingCode ? "Odesílání..." : codeSent ? "Ověřovací kód byl odeslán" : "Odeslat ověřovací kód"}
              </Button>
              {codeSent && (
                <>
                  <Input
                    type="text"
                    placeholder="Zadejte ověřovací kód"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isVerifying}
                  />
                  <Button
                    className="w-full"
                    onClick={handleVerify}
                    disabled={!verificationCode || isVerifying}
                    style={{
                      backgroundColor: customization?.primary_color,
                      color: customization?.secondary_color,
                      borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                    }}
                  >
                    {isVerifying ? "Ověřování..." : "Potvrdit věk"}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Klikněte pro přihlášení a ověření pomocí vašeho {selectedMethod === "apple" ? "Apple" : "Google"} účtu.
              </p>
              <Button
                className="w-full"
                onClick={handleVerify}
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Ověřit pomocí {selectedMethod === "apple" ? "Apple" : "Google"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

