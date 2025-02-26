"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface VerificationWidgetModalProps {
  apiKey: string
  buttonText?: string
  buttonClassName?: string
  onVerificationComplete?: (result: any) => void
  onVerificationError?: (error: Error) => void
}

export function VerificationWidgetModal({
  apiKey,
  buttonText = "Ověřit věk",
  buttonClassName = "",
  onVerificationComplete,
  onVerificationError,
}: VerificationWidgetModalProps) {
  const [open, setOpen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const widgetUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL || window.location.origin}/widget?apiKey=${apiKey}&mode=modal`

  useEffect(() => {
    // Poslouchej zprávy z iframe
    const handleMessage = (event: MessageEvent) => {
      // Ověř, že zpráva pochází z našeho widgetu
      if (event.origin !== window.location.origin) return

      if (event.data.type === "VERIFICATION_COMPLETE") {
        if (onVerificationComplete) {
          onVerificationComplete(event.data.data)
        }
        setOpen(false)
      } else if (event.data.type === "VERIFICATION_ERROR") {
        if (onVerificationError) {
          onVerificationError(new Error(event.data.data.message))
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onVerificationComplete, onVerificationError])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={buttonClassName}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="relative w-full h-[600px]">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          <iframe
            src={widgetUrl}
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}