"use client"

import { useEffect, useState } from "react"
import { CreditCard, Eye, RotateCw, Scan, Monitor, FileText, QrCode } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCustomization } from "@/lib/actions/customization"
import { FaceScanStep } from "./face-scan-step"
import { IDScanStep } from "./id-scan-step"
import { RepeatedVerificationStep } from "./repeated-verification-step"
import { OtherDeviceStep } from "./other-device-step"

const verificationMethods = [
  {
    id: "bankid",
    icon: <CreditCard className="h-8 w-8" />,
    title: "BankID",
    description: "Ověření pomocí vaší bankovní identity.",
  },
  {
    id: "mojeid"  ,
    icon: <FileText className="h-8 w-8" />,
    title: "MojeID",
    description: "Využijte svou státem garantovanou identitu MojeID.",
  },
  {
    id: "ocr",
    icon: <Monitor className="h-8 w-8" />,
    title: "Sken dokladu",
    description: "Naskenujte svůj občanský průkaz nebo cestovní pas.",
  },
  {
    id: "facescan",
    icon: <Scan className="h-8 w-8" />,
    title: "FaceScan",
    description: "Rychlé a bezpečné ověření pomocí skenování obličeje.",
  },
  {
    id: "revalidate",
    icon: <RotateCw className="h-8 w-8" />,
    title: "Opakované ověření",
    description: "Již ověření uživatelé mohou využít rychlé znovu-ověření.",
  },
  {
    id: "other_device",
    icon: <QrCode className="h-8 w-8" />,
    title: "Jiné zařízení",
    description: "Pokračujte v ověření na jiném zařízení.",
  },
]

interface PreviewModalProps {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  customization: {
    font: string
    primaryColor: string
    secondaryColor: string
    buttonStyle: string
    verificationMethods: string[]
    logo?: string
    failureAction: string
    failureRedirect?: string
  }
}

export function PreviewModal({ shopId, open, onOpenChange, customization }: PreviewModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  // Vytvoříme CSS proměnné pro celou aplikaci
  const rootStyles = {
    "--font-family": customization.font,
    "--primary-color": customization.primaryColor,
    "--secondary-color": customization.secondaryColor,
    "--button-radius": customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
  } as React.CSSProperties

  // Styly pro tlačítka, které se používají všude
  const buttonStyles = {
    backgroundColor: "var(--primary-color)",
    color: "var(--secondary-color)",
    borderRadius: "var(--button-radius)",
  }

  const handleBack = () => {
    setSelectedMethod(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div style={rootStyles} className="verification-preview">
          {!selectedMethod ? (
            <div className="space-y-4 p-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
                Ověření věku
              </h2>
              <p className="text-muted-foreground">Vyberte způsob ověření věku</p>
              <div className="grid gap-2">
                {verificationMethods
                  .filter((method) => customization.verificationMethods?.includes(method.id))
                  .map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className="group flex items-center gap-4 rounded-md border p-4 text-left transition-colors"
                      style={buttonStyles}
                    >
                      <div className="shrink-0">{method.icon}</div>
                      <div>
                        <div className="font-medium">{method.title}</div>
                        <div className="text-sm opacity-90">{method.description}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ) : selectedMethod === "facescan" ? (
            <FaceScanStep 
              onBack={handleBack} 
              apiKey={null} 
              customization={customization}
              buttonStyles={buttonStyles}
            />
          ) : selectedMethod === "ocr" ? (
            <IDScanStep 
              onBack={handleBack} 
              apiKey={null} 
              verificationId="preview" 
              customization={customization}
              buttonStyles={buttonStyles}
            />
          ) : selectedMethod === "revalidate" ? (
            <RepeatedVerificationStep 
              onBack={handleBack} 
              apiKey={null} 
              customization={customization}
              buttonStyles={buttonStyles}
            />
          ) : selectedMethod === "other_device" ? (
            <OtherDeviceStep 
              onBack={handleBack} 
              apiKey={null} 
              customization={customization}
              buttonStyles={buttonStyles}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

