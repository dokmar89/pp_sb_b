"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera, AlertTriangle } from "lucide-react"
import { VerificationResult } from "./verification-result"
import {
  loadModels,
  detectFace,
  getAgeVerificationResult,
  drawFaceDetectionGuide,
  calculateAgeConfidence,
} from "@/lib/face-detection"
import { toast } from "sonner"

interface Props {
  onBack: () => void
  apiKey: string | null
  customization?: {
    primary_color: string
    secondary_color: string
    button_style: string
  }
}

export function FaceScanStep({ onBack, apiKey, customization }: Props) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [detectedAge, setDetectedAge] = useState<number | null>(null)
  const [verificationResult, setVerificationResult] = useState<"approved" | "rejected" | "uncertain" | null>(null)
  const [faceInPosition, setFaceInPosition] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [scanningProgress, setScanningProgress] = useState(0)
  const [showUncertainDialog, setShowUncertainDialog] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const detectionCountRef = useRef(0)
  const ageAccumulatorRef = useRef<number[]>([])

  useEffect(() => {
    const initModels = async () => {
      try {
        await loadModels()
        setIsModelLoading(false)
      } catch (error) {
        toast.error("Nepodařilo se načíst modely pro detekci obličeje")
      }
    }

    initModels()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
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

  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    detectionCountRef.current = 0
    ageAccumulatorRef.current = []
    setScanningProgress(0)

    const detectFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return

      try {
        const result = await detectFace(videoRef.current)
        setFaceDetected(result.faceDetected)
        setFaceInPosition(result.faceInPosition)

        // Vykreslení vodícího oválu
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          drawFaceDetectionGuide(ctx, result.faceDetected, result.faceInPosition, {
            primaryColor: customization?.primary_color,
            secondaryColor: customization?.secondary_color,
          })
        }

        if (result.age !== null && result.faceInPosition && result.detectionConfidence > 0.8) {
          ageAccumulatorRef.current.push(result.age)
          detectionCountRef.current++

          // Aktualizace progress baru
          setScanningProgress(Math.min((detectionCountRef.current / 30) * 100, 100))

          // Pokud máme dostatek vzorků, vypočítáme průměrný věk
          if (detectionCountRef.current >= 30) {
            const { averageAge, confidence } = calculateAgeConfidence(ageAccumulatorRef.current)

            if (confidence < 0.7) {
              toast.error("Nepodařilo se spolehlivě určit věk, zkuste to prosím znovu")
              stopDetection()
              return
            }

            setDetectedAge(averageAge)
            const result = getAgeVerificationResult(averageAge)
            setVerificationResult(result)

            if (result === "uncertain") {
              setShowUncertainDialog(true)
            }

            stopDetection()
            return
          }
        }

        animationRef.current = requestAnimationFrame(detectFrame)
      } catch (error) {
        console.error("Detection error:", error)
        stopDetection()
        toast.error("Došlo k chybě při detekci obličeje")
      }
    }

    detectFrame()
  }

  const stopDetection = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsScanning(false)
  }

  if (verificationResult === "approved") {
    return <VerificationResult isVerified={true} method="facescan" apiKey={apiKey} customization={customization} />
  }

  if (verificationResult === "rejected") {
    return <VerificationResult isVerified={false} method="facescan" apiKey={apiKey} customization={customization} />
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
            FaceScan
          </h2>

          {showUncertainDialog ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <p className="text-sm text-yellow-700">
                  Věk nelze s jistotou určit (18-25 let). Prosím, použijte jinou metodu ověření.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => onBack()}
                  style={{
                    backgroundColor: customization?.primary_color,
                    color: customization?.secondary_color,
                    borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  Zvolit jinou metodu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUncertainDialog(false)
                    setVerificationResult(null)
                    setDetectedAge(null)
                    startDetection()
                  }}
                >
                  Zkusit znovu
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Pro ověření věku prosím umístěte obličej do vyznačeného oválu a držte hlavu rovně.
              </p>

              <div className="relative aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (canvasRef.current && videoRef.current) {
                      canvasRef.current.width = videoRef.current.videoWidth
                      canvasRef.current.height = videoRef.current.videoHeight
                    }
                  }}
                />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {isModelLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <div
                        className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: `${customization?.primary_color} transparent transparent transparent` }}
                      />
                      <p>Načítání modelů...</p>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${scanningProgress}%`,
                          backgroundColor: customization?.primary_color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => (isCameraActive ? startDetection() : startCamera())}
                disabled={isModelLoading || isScanning}
                className="w-full"
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {isModelLoading
                  ? "Načítání..."
                  : isScanning
                    ? "Skenování..."
                    : isCameraActive
                      ? "Spustit skenování"
                      : "Spustit kameru"}
                <Camera className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

