"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera, Upload, CheckCircle, XCircle } from "lucide-react"
import { VerificationResult } from "./verification-result"
import { processIdCard } from "@/lib/ocr"
import { toast } from "sonner"

interface Props {
  onBack: () => void
  apiKey: string | null
  verificationId: string
  customization?: {
    primary_color: string
    secondary_color: string
    button_style: string
  }
}

export function IDScanStep({ onBack, apiKey, verificationId, customization }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: { ideal: "environment" },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Nepodařilo se získat přístup ke kameře")
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              handleImage(blob)
            }
          },
          "image/jpeg",
          0.95,
        )
      }
    }
  }

  const handleImage = async (file: Blob) => {
    setIsScanning(true)
    setProcessingMessage("Načítání obrázku...")

    // Zobrazení náhledu
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setProcessingMessage("Zpracování dokladu...")
      const result = await processIdCard(file)

      if (!result.success) {
        throw new Error(result.error)
      }

      setProcessingMessage("Ověřování věku...")

      if (result.age && result.age >= 18) {
        setIsVerified(true)
        toast.success(`Věk ověřen: ${result.age} let`)
      } else {
        toast.error(`Věk není dostatečný: ${result.age} let`)
        setIsVerified(false)
      }
    } catch (error) {
      console.error("Verification error:", error)
      toast.error(error instanceof Error ? error.message : "Došlo k chybě při ověřování")
      setIsVerified(false)
    } finally {
      setIsScanning(false)
      setScanComplete(true)

      // Stop camera after scan
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        setIsCameraActive(false)
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImage(file)
    }
  }

  if (isVerified) {
    return <VerificationResult isVerified={true} method="ocr" apiKey={apiKey} customization={customization} />
  }

  return (
    <div className="max-w-md mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }
          onBack()
        }}
        style={{ color: customization?.primary_color }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
      </Button>
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Sken dokladu
          </h2>
          <p className="text-gray-600 mb-6">
            Pro ověření věku prosím naskenujte nebo vyfoťte svůj doklad totožnosti. Ujistěte se, že je datum narození
            dobře čitelné.
          </p>
          <div className="relative aspect-[3/2] mb-4 bg-gray-100 rounded-lg overflow-hidden">
            {isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : previewUrl ? (
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Camera className="w-12 h-12" />
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <div
                  className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4"
                  style={{ borderColor: `${customization?.primary_color} transparent transparent transparent` }}
                />
                <p className="text-white text-center px-4">{processingMessage}</p>
              </div>
            )}
            {scanComplete && !isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                {isVerified ? (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            capture="environment"
          />
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              style={{
                backgroundColor: customization?.primary_color,
                color: customization?.secondary_color,
                borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
              }}
            >
              Nahrát soubor
              <Upload className="ml-2 h-4 w-4" />
            </Button>
            {isCameraActive ? (
              <Button
                onClick={captureImage}
                disabled={isScanning}
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Vyfotit
                <Camera className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={startCamera}
                disabled={isScanning}
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Spustit kameru
                <Camera className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

