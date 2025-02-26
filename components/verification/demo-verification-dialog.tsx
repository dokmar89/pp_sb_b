"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Monitor, Scan, CreditCard, FileText, RotateCw, QrCode, ArrowRight } from "lucide-react"
import { FaceScanStep } from "./face-scan-step"
import { IDScanStep } from "./id-scan-step"
import { RepeatedVerificationStep } from "./repeated-verification-step"
import { OtherDeviceStep } from "./other-device-step"
import { toast } from "sonner"

const verificationMethods = [
  {
    id: "facescan",
    icon: <Scan className="h-8 w-8" />,
    title: "FaceScan",
    description: "Rychlé a bezpečné ověření pomocí skenování obličeje.",
    enabled: true,
  },
  {
    id: "bankid",
    icon: <CreditCard className="h-8 w-8" />,
    title: "BankID",
    description: "Ověření pomocí vaší bankovní identity.",
    enabled: false,
    comingSoon: true,
    tooltip: "BankID bude brzy k dispozici",
  },
  {
    id: "mojeid",
    icon: <FileText className="h-8 w-8" />,
    title: "MojeID",
    description: "Využijte svou státem garantovanou identitu MojeID pro rychlé a spolehlivé ověření věku.",
    enabled: false,
    comingSoon: true,
    tooltip: "MojeID bude brzy k dispozici",
  },
  {
    id: "ocr",
    icon: <Monitor className="h-8 w-8" />,
    title: "Sken dokladu",
    description: "Naskenujte svůj občanský průkaz nebo cestovní pas.",
    enabled: true,
  },
  {
    id: "revalidate",
    icon: <RotateCw className="h-8 w-8" />,
    title: "Opakované ověření",
    description: "Již ověření uživatelé mohou využít rychlé znovu-ověření.",
    enabled: true,
  },
  {
    id: "other_device",
    icon: <QrCode className="h-8 w-8" />,
    title: "Jiné zařízení",
    description: "Pokračujte v ověření na jiném zařízení.",
    enabled: true,
  },
]

export function DemoVerificationDialog() {
  const [open, setOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const handleMethodSelect = (method: (typeof verificationMethods)[0]) => {
    if (!method.enabled) {
      if (method.tooltip) {
        toast.info(method.tooltip)
      }
      return
    }
    setSelectedMethod(method.id)
  }

  // Demo API key
  const demoApiKey = "demo_key"

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Vyzkoušet ověření
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0">
          {!selectedMethod ? (
            <div className="space-y-4 p-6">
              <h2 className="text-2xl font-bold">Ověření věku</h2>
              <p className="text-muted-foreground">Vyberte způsob ověření věku</p>
              <div className="grid gap-2">
                {verificationMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method)}
                    className={`group flex items-center gap-4 rounded-md border p-4 text-left transition-colors relative ${
                      !method.enabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted"
                    }`}
                    disabled={!method.enabled}
                  >
                    <div className="shrink-0">{method.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{method.title}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    {method.comingSoon && (
                      <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Připravujeme
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : selectedMethod === "facescan" ? (
            <FaceScanStep onBack={handleBack} apiKey={demoApiKey} />
          ) : selectedMethod === "ocr" ? (
            <IDScanStep onBack={handleBack} apiKey={demoApiKey} verificationId="demo" />
          ) : selectedMethod === "revalidate" ? (
            <RepeatedVerificationStep onBack={handleBack} apiKey={demoApiKey} />
          ) : selectedMethod === "other_device" ? (
            <OtherDeviceStep onBack={handleBack} apiKey={demoApiKey} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

