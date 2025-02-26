"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User } from "lucide-react"
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

export function MojeIDStep({ onBack, apiKey, customization }: Props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    // Simulace ověření pro náhled
    setTimeout(() => {
      setIsVerifying(false)
      setIsVerified(true)
    }, 3000)
  }

  if (isVerified) {
    return <VerificationResult isVerified={true} method="mojeid" apiKey={apiKey} customization={customization} />
  }

  if (!isVerified && isVerifying) {
    return (
      <Card className="max-w-md mx-auto bg-white shadow-lg">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Ověřování...
          </h2>
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: `${customization?.primary_color} transparent transparent transparent` }}
          />
        </CardContent>
      </Card>
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
            MojeID
          </h2>
          <p className="text-gray-600 mb-6">Pro ověření věku pomocí MojeID zadejte své přihlašovací údaje.</p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="username">Uživatelské jméno</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying}
              style={{
                backgroundColor: customization?.primary_color,
                color: customization?.secondary_color,
                borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
              }}
            >
              {isVerifying ? "Ověřování..." : "Přihlásit se"}
              <User className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

