"use client"

import { useState } from "react"
import type { Tables } from "@/lib/supabase/types"
import { FaceScanStep } from "../verification/face-scan-step"
import { IDScanStep } from "../verification/id-scan-step"
import { BankIDStep } from "../verification/bank-id-step"
import { MojeIDStep } from "../verification/moje-id-step"
import { RepeatedVerificationStep } from "../verification/repeated-verification-step"
import { OtherDeviceStep } from "../verification/other-device-step"
import { Monitor, Scan, CreditCard, FileText, RotateCw, QrCode } from "lucide-react"

interface WidgetVerificationProps {
  shopId: string
  apiKey: string
  mode: string
  customization: Tables<"customizations">
}

const verificationMethods = [
  {
    id: "facescan",
    icon: <Scan className="h-8 w-8" />,
    title: "FaceScan",
    description: "Rychlé a bezpečné ověření pomocí skenování obličeje.",
  },
  {
    id: "bankid",
    icon: <CreditCard className="h-8 w-8" />,
    title: "BankID",
    description: "Ověření pomocí vaší bankovní identity.",
  },
  {
    id: "mojeid",
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

export function WidgetVerification({ shopId, apiKey, mode, customization }: WidgetVerificationProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const handleVerificationComplete = (result: any) => {
    // Send message to parent window
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "VERIFICATION_COMPLETE",
          data: result,
        },
        "*",
      )
    }
  }

  const handleError = (error: Error) => {
    // Send error to parent window
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "VERIFICATION_ERROR",
          data: { message: error.message },
        },
        "*",
      )
    }
  }

  const containerStyle = {
    fontFamily: customization.font,
    backgroundColor: customization.images?.background ? "transparent" : undefined,
    backgroundImage: customization.images?.background ? `url(${customization.images.background})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }

  return (
    <div className="p-6" style={containerStyle}>
      {!selectedMethod ? (
        <div className="space-y-4">
          {customization.logo_url && (
            <div className="flex justify-center">
              <img
                src={customization.logo_url || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold" style={{ color: customization.primary_color }}>
            {customization.texts?.title || "Ověření věku"}
          </h2>
          <p className="text-muted-foreground">{customization.texts?.subtitle || "Vyberte způsob ověření věku"}</p>
          <div className="grid gap-2">
            {verificationMethods
              .filter((method) => customization.verification_methods.includes(method.id))
              .map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className="flex items-center gap-4 rounded-md border p-4 text-left transition-colors hover:bg-muted"
                  style={{
                    backgroundColor: customization.primary_color,
                    color: customization.secondary_color,
                    borderRadius:
                      customization.button_style === "pill"
                        ? "9999px"
                        : customization.button_style === "square"
                          ? "0"
                          : "0.375rem",
                  }}
                >
                  <div className="shrink-0" style={{ color: customization.secondary_color }}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {customization.texts?.buttonLabels?.[
                        method.id as keyof typeof customization.texts.buttonLabels
                      ] || method.title}
                    </div>
                    <div className="text-sm opacity-90">{method.description}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ) : selectedMethod === "facescan" ? (
        <FaceScanStep
          onBack={handleBack}
          apiKey={apiKey}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : selectedMethod === "bankid" ? (
        <BankIDStep
          onBack={handleBack}
          apiKey={apiKey}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : selectedMethod === "mojeid" ? (
        <MojeIDStep
          onBack={handleBack}
          apiKey={apiKey}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : selectedMethod === "ocr" ? (
        <IDScanStep
          onBack={handleBack}
          apiKey={apiKey}
          verificationId={`widget-${Date.now()}`}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : selectedMethod === "revalidate" ? (
        <RepeatedVerificationStep
          onBack={handleBack}
          apiKey={apiKey}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : selectedMethod === "other_device" ? (
        <OtherDeviceStep
          onBack={handleBack}
          apiKey={apiKey}
          customization={customization}
          onComplete={handleVerificationComplete}
          onError={handleError}
        />
      ) : null}
    </div>
  )
}

