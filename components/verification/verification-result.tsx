"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Phone, Mail, Apple, Chrome } from "lucide-react"

interface Props {
  isVerified: boolean
  method?: "facescan" | "bankid" | "mojeid" | "ocr" | "revalidate" | "other_device"
  apiKey?: string | null
  customization?: {
    primary_color: string
    secondary_color: string
    button_style: string
  }
}

export function VerificationResult({ isVerified, method, apiKey, customization }: Props) {
  const [saveResult, setSaveResult] = useState(false)
  const [showSaveOptions, setShowSaveOptions] = useState(false)
  const [selectedSaveMethod, setSelectedSaveMethod] = useState<string | null>(null)
  const [phoneOrEmail, setPhoneOrEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [pairingComplete, setPairingComplete] = useState(false)

  const handleSaveResultChange = (checked: boolean) => {
    setSaveResult(checked)
    setShowSaveOptions(checked)
    if (!checked) {
      setSelectedSaveMethod(null)
      setPhoneOrEmail("")
      setVerificationCode("")
      setCodeSent(false)
    }
  }

  const handleSaveMethodSelect = (method: string) => {
    setSelectedSaveMethod(method)
  }

  const handleSendCode = () => {
    setCodeSent(true)
  }

  const handlePair = () => {
    setPairingComplete(true)
  }

  const handleCookieSave = () => {
    setPairingComplete(true)
  }

  if (!isVerified) {
    return (
      <Card className="max-w-md mx-auto bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
              Nepodařilo se ověřit váš věk
            </h2>
            <p className="text-gray-600 mb-6 text-center">Zkuste to, až vám bude 18, do té doby nashledanou.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (method === "revalidate") {
    return (
      <Card className="max-w-md mx-auto bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
              Věk byl ověřen
            </h2>
            <p className="text-gray-600 mb-6 text-center">Děkujeme za ověření.</p>
            <Button
              className="w-full"
              style={{
                backgroundColor: customization?.primary_color,
                color: customization?.secondary_color,
                borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
              }}
              onClick={() => window.close()}
            >
              Zavřít
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto bg-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Věk byl ověřen
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Děkujeme za trpělivost. Chcete si uložit výsledek pro příští ověření?
          </p>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox id="saveResult" checked={saveResult} onCheckedChange={handleSaveResultChange} />
            <Label htmlFor="saveResult">Uložit výsledek</Label>
          </div>
          {showSaveOptions && (
            <div className="w-full space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveMethodSelect("phone")}
                style={{
                  borderColor: customization?.primary_color,
                  color: customization?.primary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                <Phone className="mr-2 h-4 w-4" /> Telefon
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveMethodSelect("email")}
                style={{
                  borderColor: customization?.primary_color,
                  color: customization?.primary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                <Mail className="mr-2 h-4 w-4" /> Email
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveMethodSelect("apple")}
                style={{
                  borderColor: customization?.primary_color,
                  color: customization?.primary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                <Apple className="mr-2 h-4 w-4" /> Propojit AppleID
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveMethodSelect("google")}
                style={{
                  borderColor: customization?.primary_color,
                  color: customization?.primary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                <Chrome className="mr-2 h-4 w-4" /> Propojit Google účet
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCookieSave}
                style={{
                  borderColor: customization?.primary_color,
                  color: customization?.primary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Uložit do prohlížeče
              </Button>
            </div>
          )}
          {(selectedSaveMethod === "phone" || selectedSaveMethod === "email") && (
            <div className="w-full mt-4 space-y-4">
              <Input
                type={selectedSaveMethod === "phone" ? "tel" : "email"}
                placeholder={selectedSaveMethod === "phone" ? "Zadejte telefonní číslo" : "Zadejte email"}
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={!phoneOrEmail || codeSent}
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {codeSent ? "Ověřovací kód byl odeslán" : "Odeslat ověřovací kód"}
              </Button>
              {codeSent && (
                <>
                  <Input
                    type="text"
                    placeholder="Zadejte ověřovací kód"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={handlePair}
                    disabled={!verificationCode || pairingComplete}
                    style={{
                      backgroundColor: customization?.primary_color,
                      color: customization?.secondary_color,
                      borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                    }}
                  >
                    {pairingComplete ? "Spárováno" : "Spárovat"}
                  </Button>
                </>
              )}
            </div>
          )}
          {pairingComplete && (
            <p className="mt-4 text-center text-green-600 font-semibold">Účet byl úspěšně propojen.</p>
          )}
          <Button
            className="w-full mt-6"
            onClick={() => window.close()}
            style={{
              backgroundColor: customization?.primary_color,
              color: customization?.secondary_color,
              borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
            }}
          >
            Zavřít
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

