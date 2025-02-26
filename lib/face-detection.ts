import * as faceapi from "face-api.js"

let modelsLoaded = false

export async function loadModels() {
  if (modelsLoaded) return

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.ageGenderNet.loadFromUri("/models"),
    ])

    modelsLoaded = true
  } catch (error) {
    console.error("Error loading face-api models:", error)
    throw new Error("Nepodařilo se načíst modely pro detekci obličeje")
  }
}

export interface DetectionResult {
  age: number | null
  detectionConfidence: number
  faceInPosition: boolean
  faceDetected: boolean
  error?: string
}

// Typy chyb, které mohou nastat při detekci
interface DetekceChyba {
  typ: 'CHYBA_MODELU' | 'CHYBA_KAMERY' | 'CHYBA_DETEKCE';
  zprava: string;
}

export async function detectFace(videoElement: HTMLVideoElement): Promise<DetectionResult> {
  if (!modelsLoaded) {
    throw new Error("Modely nejsou načteny")
  }

  try {
    // Kontrola, zda video běží a má rozměry
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      throw { typ: 'CHYBA_KAMERY', zprava: 'Video stream není aktivní' } as DetekceChyba;
    }

    // Přidání timeoutu pro detekci
    const detection = await Promise.race([
      faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender(),
      new Promise((_, reject) => 
        setTimeout(() => reject({ 
          typ: 'CHYBA_DETEKCE', 
          zprava: 'Vypršel časový limit pro detekci' 
        }), 5000)
      )
    ]);

    if (!detection) {
      return {
        age: null,
        detectionConfidence: 0,
        faceInPosition: false,
        faceDetected: false,
        error: "Obličej nebyl nalezen v záběru"
      }
    }

    // Kontrola pozice obličeje
    const videoWidth = videoElement.videoWidth
    const videoHeight = videoElement.videoHeight
    const faceBox = detection.detection.box

    // Kontrola, zda je obličej ve středu a dostatečně velký
    const isCentered =
      faceBox.x > videoWidth * 0.25 &&
      faceBox.x + faceBox.width < videoWidth * 0.75 &&
      faceBox.y > videoHeight * 0.15 &&
      faceBox.y + faceBox.height < videoHeight * 0.85

    const isLargeEnough = faceBox.width * faceBox.height > videoWidth * videoHeight * 0.1

    return {
      age: Math.round(detection.age),
      detectionConfidence: detection.detection.score,
      faceInPosition: isCentered && isLargeEnough,
      faceDetected: true,
    }

  } catch (error) {
    console.error("Chyba při detekci obličeje:", error);
    const detekceChyba = error as DetekceChyba;
    
    return {
      age: null,
      detectionConfidence: 0,
      faceInPosition: false,
      faceDetected: false,
      error: detekceChyba.zprava || "Neočekávaná chyba při detekci obličeje"
    }
  }
}

export function isAgeUncertain(age: number): boolean {
  return age >= 18 && age <= 25
}

export function getAgeVerificationResult(age: number): "approved" | "rejected" | "uncertain" {
  if (age < 18) return "rejected"
  if (age > 25) return "approved"
  return "uncertain"
}

export function drawFaceDetectionGuide(
  ctx: CanvasRenderingContext2D,
  faceDetected: boolean,
  faceInPosition: boolean,
  customization?: {
    primaryColor?: string
    secondaryColor?: string
  },
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2
  const radiusX = width * 0.3
  const radiusY = height * 0.4

  // Vyčištění plátna
  ctx.clearRect(0, 0, width, height)

  // Nastavení průhlednosti pro pozadí mimo ovál
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.fillRect(0, 0, width, height)

  // Vykreslení průhledného oválu
  ctx.save()
  ctx.globalCompositeOperation = "destination-out"
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()

  // Vykreslení ohraničení oválu
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
  ctx.strokeStyle = faceDetected
    ? faceInPosition
      ? customization?.primaryColor || "#22c55e"
      : "#dc2626"
    : customization?.secondaryColor || "#ffffff"
  ctx.lineWidth = 3
  ctx.stroke()

  // Přidání textu pod ovál
  ctx.textAlign = "center"
  ctx.fillStyle = customization?.secondaryColor || "#ffffff"
  ctx.font = "14px sans-serif"

  if (!faceDetected) {
    ctx.fillText("Umístěte obličej do oválu", centerX, centerY + radiusY + 30)
  } else if (!faceInPosition) {
    ctx.fillText("Přibližte se nebo se vzdalte od kamery", centerX, centerY + radiusY + 30)
  }
}

export function calculateAgeConfidence(ages: number[]): {
  averageAge: number
  confidence: number
} {
  if (ages.length === 0) {
    return { averageAge: 0, confidence: 0 }
  }

  // Výpočet průměrného věku
  const averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)

  // Výpočet směrodatné odchylky
  const variance = ages.reduce((sum, age) => sum + Math.pow(age - averageAge, 2), 0) / ages.length
  const standardDeviation = Math.sqrt(variance)

  // Výpočet confidence score (0-1) na základě směrodatné odchylky
  // Menší odchylka = vyšší confidence
  const confidence = Math.max(0, Math.min(1, 1 - standardDeviation / 10))

  return {
    averageAge,
    confidence,
  }
}

