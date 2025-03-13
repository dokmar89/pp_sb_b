// lib/face-detection.ts
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

// Global variables for detection state
let faceModel: any = null;
let ageModel: any = null;
let modelLoading = false;

// Konstanta pro kalibraci věku - snížení odhadovaného věku
export const AGE_CALIBRATION_OFFSET = 10; // Snížení o 10 let

// Jednoduchá funkce pro načtení modelů
export const loadModels = async () => {
  try {
    console.log("Loading face-api.js models...");
    
    // Definujeme cestu k modelům
    const MODEL_URL = '/models';
    
    // Načteme pouze nezbytné modely
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
    
    console.log("Models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
};

export interface DetectionResult {
  age: number | null
  detectionConfidence: number
  faceInPosition: boolean
  faceDetected: boolean
  error?: string
}

// Zjednodušená funkce pro detekci obličeje
export const detectFace = async (videoElement: HTMLVideoElement) => {
  try {
    // Kontrola, zda je video element validní
    if (!videoElement) {
      console.error("Invalid video element");
      return { 
        faceDetected: false, 
        faceInPosition: false, 
        age: null,
        detectionConfidence: 0
      };
    }

    // Použijeme pouze TinyFaceDetector pro detekci obličeje
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(videoElement, options);
    
    // Pokud nemáme detekce, vrátíme negativní výsledek
    if (detections.length === 0) {
      return { 
        faceDetected: false, 
        faceInPosition: false, 
        age: null,
        detectionConfidence: 0 
      };
    }
    
    // Bereme největší detekovaný obličej (nejblíže ke kameře)
    const detection = detections.sort((a, b) => b.box.area - a.box.area)[0];
    
    // Získáme rozměry videa
    const { videoWidth, videoHeight } = videoElement;
    
    // Kontrola, zda je obličej ve správné pozici (uprostřed)
    const box = detection.box;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    const isInCenterX = Math.abs(centerX - videoWidth / 2) < videoWidth * 0.2;
    const isInCenterY = Math.abs(centerY - videoHeight / 2) < videoHeight * 0.2;
    const isProperSize = box.width > videoWidth * 0.2 && box.height > videoHeight * 0.2;
    
    const faceInPosition = isInCenterX && isInCenterY && isProperSize;
    
    // Samostatně detekujeme věk a pohlaví
    let age = null;
    let gender = null;
    let genderProbability = -1;
    
    try {
      // Vytvoříme výřez obličeje pro detekci věku
      const regionsToExtract = [
        new faceapi.Rect(box.x, box.y, box.width, box.height)
      ];
      
      // Extrahujeme obličej z videa
      const canvases = await faceapi.extractFaces(videoElement, regionsToExtract);
      
      if (canvases.length > 0) {
        // Detekujeme věk a pohlaví na extrahovaném obličeji
        const ageResults = await faceapi.detectSingleFace(canvases[0], options)
          .withAgeAndGender();
        
        if (ageResults) {
          age = ageResults.age;
          gender = ageResults.gender;
          genderProbability = ageResults.genderProbability;
        }
      }
    } catch (ageError) {
      console.error("Error detecting age:", ageError);
      // Pokračujeme i bez detekce věku
    }
    
    // Pokud se nepodařilo detekovat věk, použijeme náhodný věk pro testování
    if (age === null && process.env.NODE_ENV === 'development') {
      age = Math.floor(Math.random() * 40) + 15; // Náhodný věk 15-55 pro testování
      console.log("Using random age for testing:", age);
    }
    
    // Aplikujeme kalibraci věku
    const calibratedAge = age !== null ? Math.max(1, age - AGE_CALIBRATION_OFFSET) : null;
    
    return {
      faceDetected: true,
      faceInPosition,
      age: calibratedAge,
      rawAge: age,
      gender,
      genderProbability,
      detection: {
        box: box,
        score: detection.score
      },
      detectionConfidence: detection.score
    };
  } catch (error) {
    console.error('Error detecting face:', error);
    return { 
      faceDetected: false, 
      faceInPosition: false, 
      age: null,
      detectionConfidence: 0 
    };
  }
};

// Jednoduchá funkce pro výpočet věku
export const calculateAgeConfidence = (ageValues: number[]) => {
  if (ageValues.length === 0) return { averageAge: 0, confidence: 0 };
  
  // Vypočítáme průměrný věk
  const sum = ageValues.reduce((acc, age) => acc + age, 0);
  const averageAge = Math.round(sum / ageValues.length);
  
  // Jednoduchý výpočet spolehlivosti - vždy vrátíme vysokou hodnotu pro testování
  const confidence = 0.9;
  
  return {
    averageAge,
    confidence
  };
};

// Funkce pro určení výsledku ověření věku
export const getAgeVerificationResult = (age: number): "approved" | "rejected" | "uncertain" => {
  if (age < 18) {
    return "rejected";
  } else if (age >= 25) {
    return "approved";
  } else {
    return "uncertain";
  }
};

// Funkce pro vykreslení vodítka pro detekci obličeje
export const drawFaceDetectionGuide = (
  ctx: CanvasRenderingContext2D, 
  faceDetected: boolean, 
  faceInPosition: boolean,
  options?: {
    primaryColor?: string,
    secondaryColor?: string
  }
) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Vyčistíme canvas
  ctx.clearRect(0, 0, width, height);
  
  // Nastavíme barvy
  const primaryColor = options?.primaryColor || '#3b82f6';
  const secondaryColor = options?.secondaryColor || '#ffffff';
  
  // Vykreslíme ovál pro umístění obličeje
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * 0.3;
  const radiusY = height * 0.4;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  
  // Nastavíme styl podle stavu detekce
  if (faceDetected && faceInPosition) {
    // Obličej je detekován a ve správné pozici - zelená
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
  } else if (faceDetected) {
    // Obličej je detekován, ale není ve správné pozici - žlutá
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
  } else {
    // Obličej není detekován - červená
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
  }
  
  ctx.stroke();
  
  // Přidáme text s instrukcemi
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = secondaryColor;
  
  // Přidáme stín pro lepší čitelnost
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  if (!faceDetected) {
    ctx.fillText('Obličej není detekován', centerX, height - 40);
    ctx.fillText('Umístěte obličej do oválu', centerX, height - 20);
  } else if (!faceInPosition) {
    ctx.fillText('Umístěte obličej do středu oválu', centerX, height - 40);
    ctx.fillText('a držte hlavu rovně', centerX, height - 20);
  } else {
    ctx.fillText('Obličej detekován správně', centerX, height - 40);
    ctx.fillText('Držte pozici pro dokončení skenování', centerX, height - 20);
  }
  
  // Zrušíme stín
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

// Funkce pro detekci věku z obrázku
export const detectAge = async (image: File | Blob): Promise<DetectionResult> => {
  try {
    // Načtení obrázku
    const img = await faceapi.bufferToImage(image)

    // Použijeme pouze TinyFaceDetector pro detekci obličeje
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(img, options).withAgeAndGender();

    if (detections.length === 0) {
      return { 
        faceDetected: false, 
        faceInPosition: false, 
        age: null,
        detectionConfidence: 0
      };
    }

    // Vezmeme první detekovaný obličej (předpokládáme, že je na obrázku jen jeden)
    const detection = detections[0];
    
    // Na obrázku předpokládáme, že obličej je ve správné pozici
    const faceInPosition = true;
    
    // Aplikujeme kalibraci věku
    const calibratedAge = detection.age !== null ? Math.max(1, detection.age - AGE_CALIBRATION_OFFSET) : null;
    
    return {
      faceDetected: true,
      faceInPosition,
      age: calibratedAge,
      detectionConfidence: detection.detection.score
    };
  } catch (error) {
    console.error('Error detecting age from image:', error);
    return { 
      faceDetected: false, 
      faceInPosition: false, 
      age: null,
      detectionConfidence: 0,
      error: error instanceof Error ? error.message : "Neznámá chyba při detekci věku"
    };
  }
};

// Pomocná funkce pro převod File na Image element
async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(file);
  });
}

// Pomocná funkce pro extrakci obličeje z obrázku
async function extractFaceFromImage(
  img: HTMLImageElement, 
  face: blazeface.NormalizedFace
): Promise<tf.Tensor3D> {
  // Get face bounding box
  const [x1, y1] = face.topLeft;
  const [x2, y2] = face.bottomRight;
  const width = x2 - x1;
  const height = y2 - y1;
  
  // Add some margin to include the whole face
  const margin = Math.max(width, height) * 0.2;
  const boxX = Math.max(0, x1 - margin);
  const boxY = Math.max(0, y1 - margin);
  const boxWidth = Math.min(img.width - boxX, width + 2 * margin);
  const boxHeight = Math.min(img.height - boxY, height + 2 * margin);
  
  // Extract face image
  return tf.tidy(() => {
    // Capture the frame from image
    const imageFrame = tf.browser.fromPixels(img);
    
    // Extract face region
    const face = tf.image.cropAndResize(
      imageFrame.expandDims(0),
      [[boxY / img.height, boxX / img.width, 
        (boxY + boxHeight) / img.height, (boxX + boxWidth) / img.width]],
      [0],
      [224, 224] // Resize to model input size
    );
    
    // Normalize pixel values to [-1, 1]
    return face.squeeze().div(127.5).sub(1);
  });
}
