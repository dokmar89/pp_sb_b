"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera, AlertTriangle } from "lucide-react"
import { VerificationResult } from "./verification-result"
import setupNodePolyfills from "@/lib/node-polyfills"
import {
  loadModels,
  detectFace,
  getAgeVerificationResult,
  drawFaceDetectionGuide,
  calculateAgeConfidence,
} from "@/lib/face-detection"
import { toast } from "sonner"

// Inicializace polyfilů pro Node.js moduly
setupNodePolyfills();

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
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isRequestingCamera, setIsRequestingCamera] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const detectionCountRef = useRef(0)
  const ageAccumulatorRef = useRef<number[]>([])

  useEffect(() => {
    const initModels = async () => {
      try {
        console.log("Initializing face detection models...");
        await loadModels()
        console.log("Face detection models loaded successfully");
        setIsModelLoading(false)
      } catch (error) {
        console.error("Failed to load face detection models:", error);
        toast.error("Nepodařilo se načíst modely pro detekci obličeje")
        setCameraError("Nepodařilo se načíst modely pro detekci obličeje. Zkuste obnovit stránku nebo použít jiný prohlížeč.")
      }
    }

    initModels()

    // Kontrola, zda je kamera dostupná
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          console.log("Available video devices:", videoDevices);
          
          if (videoDevices.length === 0) {
            setCameraError("Nebyla nalezena žádná kamera. Připojte kameru a obnovte stránku.");
          }
        })
        .catch(err => {
          console.error("Error enumerating devices:", err);
          setCameraError("Nepodařilo se zjistit dostupné kamery. Zkuste povolit přístup ke kameře v nastavení prohlížeče.");
        });
    } else {
      console.error("getUserMedia not supported");
      setCameraError("Váš prohlížeč nepodporuje přístup ke kameře. Zkuste použít jiný prohlížeč, například Chrome nebo Firefox.");
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Funkce pro inicializaci canvasu
  const initCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Nastavení rozměrů canvasu podle videa
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    // Vykreslení počátečního stavu
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFaceDetectionGuide(ctx, false, false, {
        primaryColor: customization?.primary_color,
        secondaryColor: customization?.secondary_color,
      });
    }
  };

  // Přidání event listeneru pro načtení videa
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        initCanvas();
      };
    }
  }, [videoRef.current]);

  const startCamera = async () => {
    try {
      // Kontrola, zda je MediaDevices API dostupné
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Váš prohlížeč nepodporuje přístup ke kameře");
      }

      console.log("Requesting camera access...");
      setIsRequestingCamera(true);
      
      // Nejprve zkusíme získat seznam dostupných zařízení
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log("Available video devices:", videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error("Nebyla nalezena žádná kamera");
      }

      // Požádáme o přístup ke kameře s optimálními parametry
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      console.log("Camera access granted:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Přidáme event listener pro kontrolu, zda se video skutečně načetlo
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log("Video playback started");
                streamRef.current = stream;
                setIsCameraActive(true);
                setCameraError(null);
                setIsRequestingCamera(false);
                
                // Inicializace canvasu po načtení videa
                initCanvas();
                
                // Spustíme detekci obličeje automaticky po načtení kamery
                setTimeout(() => {
                  startDetection();
                }, 1000);
              })
              .catch(err => {
                console.error("Error starting video playback:", err);
                toast.error("Nepodařilo se spustit video");
                setCameraError("Nepodařilo se spustit video. Zkuste obnovit stránku nebo použít jiný prohlížeč.");
                setIsRequestingCamera(false);
              });
          }
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsRequestingCamera(false);
      
      let errorMessage = "Nepodařilo se získat přístup ke kameře";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = "Přístup ke kameře byl zamítnut. Musíte povolit přístup ke kameře v nastavení prohlížeče.";
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = "Nebyla nalezena žádná kamera. Připojte kameru a zkuste to znovu.";
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = "Kamera je již používána jinou aplikací. Zavřete ostatní aplikace, které mohou používat kameru.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "Požadované parametry kamery nejsou podporovány. Zkuste použít jiné nastavení.";
        } else if (error.name === 'TypeError') {
          errorMessage = "Neplatné parametry pro přístup ke kameře. Zkuste to znovu.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setCameraError(`${errorMessage}. Zkontrolujte, zda máte povolen přístup ke kameře v nastavení prohlížeče.`);
    }
  };

  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    detectionCountRef.current = 0
    ageAccumulatorRef.current = []
    setScanningProgress(0)

    // Inicializace canvasu před detekcí
    initCanvas();
    
    // Nastavíme timeout pro detekci - pokud se nepodaří detekovat obličej do 30 sekund, ukončíme detekci
    const detectionTimeout = setTimeout(() => {
      if (detectionCountRef.current === 0) {
        console.log("Detection timeout - no face detected");
        stopDetection();
        toast.error("Nepodařilo se detekovat obličej. Zkuste to prosím znovu s lepším osvětlením a ujistěte se, že je váš obličej viditelný.");
      }
    }, 30000);

    const detectFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return

      try {
        console.log('Starting face detection frame')
        const result = await detectFace(videoRef.current)
        console.log('Detection result:', result)

        setFaceDetected(result.faceDetected)
        setFaceInPosition(result.faceInPosition)

        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          console.log('Drawing face detection guide')
          // Zajistíme, že canvas má správné rozměry
          if (canvasRef.current.width !== videoRef.current.videoWidth || 
              canvasRef.current.height !== videoRef.current.videoHeight) {
            canvasRef.current.width = videoRef.current.videoWidth || videoRef.current.clientWidth;
            canvasRef.current.height = videoRef.current.videoHeight || videoRef.current.clientHeight;
          }
          
          drawFaceDetectionGuide(ctx, result.faceDetected, result.faceInPosition, {
            primaryColor: customization?.primary_color,
            secondaryColor: customization?.secondary_color,
          })
        } else {
          console.error('Could not get canvas context')
        }

        // Process detection results
        if (result.age !== null && result.faceInPosition && result.detectionConfidence > 0.3) { // Snížení prahu pro detekci
          ageAccumulatorRef.current.push(result.age)
          detectionCountRef.current++

          // Update progress bar
          const progress = Math.min((detectionCountRef.current / 10) * 100, 100) // Snížení počtu vzorků pro rychlejší detekci
          setScanningProgress(progress)

          // If we have enough samples, calculate average age
          if (detectionCountRef.current >= 10) { // Snížení počtu vzorků pro rychlejší detekci
            clearTimeout(detectionTimeout); // Zrušení timeoutu
            
            const { averageAge, confidence } = calculateAgeConfidence(ageAccumulatorRef.current)

            if (confidence < 0.5) { // Snížení prahu pro confidence
              toast.error('Nepodařilo se spolehlivě určit věk, zkuste to prosím znovu')
              stopDetection()
              return
            }

            setDetectedAge(averageAge)
            const result = getAgeVerificationResult(averageAge)
            setVerificationResult(result)

            if (result === 'uncertain') {
              setShowUncertainDialog(true)
            }

            stopDetection()
            return
          }
        }

        // Continue detection loop
        animationRef.current = requestAnimationFrame(detectFrame)
      } catch (error) {
        console.error('Detection error:', error)
        clearTimeout(detectionTimeout); // Zrušení timeoutu
        stopDetection()
        toast.error('Došlo k chybě při detekci obličeje')
        setCameraError('Došlo k chybě při detekci obličeje. Zkuste to prosím znovu nebo použijte jinou metodu ověření.');
      }
    }

    detectFrame()
    
    return () => {
      clearTimeout(detectionTimeout); // Zrušení timeoutu při ukončení
    }
  }

  const stopDetection = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsScanning(false)
  }

  const handleCameraPermission = () => {
    // Otevře nastavení prohlížeče pro povolení kamery
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(permissionStatus => {
          if (permissionStatus.state === 'denied') {
            // Otevře nové okno s instrukcemi
            window.open('https://support.google.com/chrome/answer/2693767?hl=cs', '_blank');
          } else {
            // Zkusí znovu požádat o přístup ke kameře
            startCamera();
          }
        })
        .catch(error => {
          console.error("Error checking camera permission:", error);
          // Zkusí znovu požádat o přístup ke kameře
          startCamera();
        });
    } else {
      // Fallback pro prohlížeče, které nepodporují Permissions API
      window.open('https://support.google.com/chrome/answer/2693767?hl=cs', '_blank');
    }
  };

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

          {cameraError ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">
                  {cameraError}
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
                  onClick={handleCameraPermission}
                >
                  Povolit kameru
                </Button>
              </div>
            </div>
          ) : showUncertainDialog ? (
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

              <div className="relative aspect-video mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ zIndex: 1 }}
                />

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
                disabled={isModelLoading || isScanning || isRequestingCamera}
                className="w-full"
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {isModelLoading
                  ? "Načítání modelů..."
                  : isRequestingCamera
                    ? "Požadování přístupu ke kameře..."
                    : isScanning
                      ? "Probíhá skenování obličeje..."
                      : isCameraActive
                        ? "Spustit nové skenování"
                        : "Povolit kameru a spustit skenování"}
                <Camera className="ml-2 h-4 w-4" />
              </Button>

              {/* Přidání informačního textu */}
              {isCameraActive && !isScanning && (
                <p className="text-xs text-center mt-2 text-gray-500">
                  Umístěte obličej do vyznačeného oválu a držte hlavu rovně.
                </p>
              )}
              {isScanning && (
                <p className="text-xs text-center mt-2 text-gray-500">
                  Držte hlavu rovně a nehýbejte se, dokud nebude skenování dokončeno.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
