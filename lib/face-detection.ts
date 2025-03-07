// lib/face-detection.ts
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

// Global variables for detection state
let faceModel: blazeface.BlazeFaceModel | null = null;
let ageModel: tf.GraphModel | null = null;
let modelLoading = false;

// Function to load the models
export async function loadModels() {
  if (faceModel && ageModel) {
    console.log("Models already loaded");
    return Promise.resolve();
  }
  
  if (modelLoading) {
    console.log("Models loading in progress");
    // Wait for models to load
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return Promise.resolve();
  }
  
  try {
    console.log("Starting to load models...");
    modelLoading = true;
    
    // Initialize TensorFlow.js
    await tf.ready();
    console.log("TensorFlow.js initialized with backend:", tf.getBackend());
    
    // Load BlazeFace model
    if (!faceModel) {
      console.log("Loading BlazeFace model...");
      faceModel = await blazeface.load();
      console.log("BlazeFace model loaded successfully");
    }
    
    // Load Age estimation model
    if (!ageModel) {
      console.log("Loading Age estimation model...");
      // Load the age estimation model from TensorFlow Hub
      ageModel = await tf.loadGraphModel(
        'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/classification/5/default/1',
        { fromTFHub: true }
      );
      console.log("Age estimation model loaded successfully");
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  } finally {
    modelLoading = false;
  }
}

export interface DetectionResult {
  age: number | null
  detectionConfidence: number
  faceInPosition: boolean
  faceDetected: boolean
  error?: string
}

// Helper function to extract face from video
async function extractFace(
  video: HTMLVideoElement, 
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
  const boxWidth = Math.min(video.videoWidth - boxX, width + 2 * margin);
  const boxHeight = Math.min(video.videoHeight - boxY, height + 2 * margin);
  
  // Extract face image
  return tf.tidy(() => {
    // Capture the frame from video
    const videoFrame = tf.browser.fromPixels(video);
    
    // Extract face region
    const face = tf.image.cropAndResize(
      videoFrame.expandDims(0),
      [[boxY / video.videoHeight, boxX / video.videoWidth, 
        (boxY + boxHeight) / video.videoHeight, (boxX + boxWidth) / video.videoWidth]],
      [0],
      [224, 224] // Resize to model input size
    );
    
    // Normalize pixel values to [-1, 1]
    return face.squeeze().div(127.5).sub(1);
  });
}

// Function to estimate age from face image
async function estimateAge(faceImage: tf.Tensor3D): Promise<number> {
  if (!ageModel) {
    throw new Error("Age model not loaded");
  }
  
  return tf.tidy(() => {
    // Prepare input for the model
    const input = faceImage.expandDims(0);
    
    // Run inference
    const predictions = ageModel!.predict(input) as tf.Tensor;
    
    // Process predictions to get age
    // This is a simplified approach - in a real app, you'd have a more sophisticated age estimation
    // For now, we'll map the output to an age range of 15-60
    const ageRange = tf.linspace(15, 60, predictions.shape[1]);
    const softmax = tf.softmax(predictions);
    const weightedAge = tf.sum(tf.mul(softmax, ageRange)).dataSync()[0];
    
    return Math.round(weightedAge);
  });
}

export async function detectFace(videoElement: HTMLVideoElement): Promise<DetectionResult> {
  // Check if models are loaded
  if (!faceModel || !ageModel) {
    try {
      await loadModels();
    } catch (error) {
      console.error("Failed to load models:", error);
      return {
        age: null,
        detectionConfidence: 0,
        faceInPosition: false,
        faceDetected: false,
        error: error instanceof Error ? error.message : "Unknown error loading models"
      };
    }
  }

  // Check if video is ready
  if (!videoElement || videoElement.readyState !== 4) {
    console.error("Video element not ready");
    return {
      age: null,
      detectionConfidence: 0,
      faceInPosition: false,
      faceDetected: false,
      error: "Video not ready"
    };
  }

  try {
    console.log("Starting face detection");
    
    // Perform detection
    const predictions = await faceModel!.estimateFaces(videoElement, false);
    
    if (predictions.length === 0) {
      console.log("No face detected");
      return {
        age: null,
        detectionConfidence: 0,
        faceInPosition: false,
        faceDetected: false
      };
    }
    
    // Get the first face
    const face = predictions[0];
    console.log("Face detected with confidence:", face.probability[0]);
    
    // Calculate if face is in position (center of the video)
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const centerX = videoWidth / 2;
    const centerY = videoHeight / 2;
    
    // Get face center
    const faceX = face.topLeft[0] + (face.bottomRight[0] - face.topLeft[0]) / 2;
    const faceY = face.topLeft[1] + (face.bottomRight[1] - face.topLeft[1]) / 2;
    
    // Get face size
    const faceWidth = face.bottomRight[0] - face.topLeft[0];
    const faceHeight = face.bottomRight[1] - face.topLeft[1];
    
    // Check if face is in center and has appropriate size
    // More lenient position check but stricter size check
    const isInPosition = 
      Math.abs(faceX - centerX) < videoWidth * 0.25 && // 25% tolerance for horizontal position
      Math.abs(faceY - centerY) < videoHeight * 0.25 && // 25% tolerance for vertical position
      faceWidth > videoWidth * 0.15 && // Face should be at least 15% of frame width
      faceHeight > videoHeight * 0.15; // Face should be at least 15% of frame height
    
    // If face is in position, estimate age
    let age: number | null = null;
    if (isInPosition) {
      try {
        // Extract face from video
        const faceImage = await extractFace(videoElement, face);
        
        // Estimate age
        age = await estimateAge(faceImage);
        console.log("Estimated age:", age);
        
        // Dispose tensor to prevent memory leaks
        faceImage.dispose();
      } catch (error) {
        console.error("Error estimating age:", error);
      }
    }
    
    return {
      age,
      detectionConfidence: face.probability[0],
      faceInPosition: isInPosition,
      faceDetected: true
    };
  } catch (error) {
    console.error("Detection error:", error);
    return {
      age: null,
      detectionConfidence: 0,
      faceInPosition: false,
      faceDetected: false,
      error: error instanceof Error ? error.message : "Unknown detection error"
    };
  }
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
  if (!ctx) {
    console.error("Canvas context is null");
    return;
  }

  const canvas = ctx.canvas;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radiusX = Math.min(150, canvas.width * 0.3);
  const radiusY = Math.min(200, canvas.height * 0.4);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set ellipse color based on detection state
  let ellipseColor = customization?.primaryColor || '#ff4444'; // Red - default
  if (faceDetected && !faceInPosition) {
    ellipseColor = '#ffcc00'; // Yellow - face detected but not in position
  } else if (faceDetected && faceInPosition) {
    ellipseColor = '#00cc66'; // Green - face detected and in position
  }

  // Add semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ellipse with glow effect when face is in position
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  
  if (faceDetected && faceInPosition) {
    // Add glow effect for green state
    ctx.shadowColor = '#00cc66';
    ctx.shadowBlur = 15;
  } else {
    ctx.shadowBlur = 0;
  }
  
  ctx.strokeStyle = ellipseColor;
  ctx.lineWidth = 6;
  ctx.stroke();
  
  // Reset shadow for other drawings
  ctx.shadowBlur = 0;

  // Add transparent area inside ellipse
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX - 3, radiusY - 3, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Draw face position indicator with animation
  if (faceDetected) {
    // Add pulsing animation
    const now = Date.now();
    const scale = 1 + 0.2 * Math.sin(now / 200); // Pulsing effect
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = ellipseColor;
    ctx.fill();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // Add checkmark when face is in position
    if (faceInPosition) {
      const checkSize = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(centerX - checkSize/2, centerY);
      ctx.lineTo(centerX - checkSize/6, centerY + checkSize/2);
      ctx.lineTo(centerX + checkSize/2, centerY - checkSize/3);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  }

  // Add text instructions with better visibility
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  
  // Add background for text for better readability
  const textY = canvas.height - 40;
  let message = 'Prosím, umístěte obličej do oválu';
  
  if (!faceDetected) {
    message = 'Prosím, umístěte obličej do oválu';
  } else if (!faceInPosition) {
    message = 'Přibližte se k centru oválu';
  } else {
    message = 'Výborně! Držte pozici pro skenování';
  }
  
  // Measure text width
  const textWidth = ctx.measureText(message).width;
  
  // Draw background for text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(centerX - textWidth/2 - 10, textY - 20, textWidth + 20, 30);
  
  // Draw text
  ctx.fillStyle = ellipseColor;
  ctx.fillText(message, centerX, textY);
  
  // Add status indicator at the top
  const statusY = 30;
  let statusMessage = '';
  
  if (!faceDetected) {
    statusMessage = 'Hledám obličej...';
  } else if (!faceInPosition) {
    statusMessage = 'Obličej detekován - upravte pozici';
  } else {
    statusMessage = 'Obličej ve správné pozici - probíhá skenování';
  }
  
  // Measure status width
  const statusWidth = ctx.measureText(statusMessage).width;
  
  // Draw background for status
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(centerX - statusWidth/2 - 10, statusY - 20, statusWidth + 20, 30);
  
  // Draw status
  ctx.fillStyle = ellipseColor;
  ctx.fillText(statusMessage, centerX, statusY);
  
  // Add corner markers for better framing
  const cornerSize = 20;
  const cornerOffset = 5;
  ctx.strokeStyle = ellipseColor;
  ctx.lineWidth = 4;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX - cornerOffset, centerY - radiusY - cornerOffset);
  ctx.lineTo(centerX - radiusX - cornerOffset, centerY - radiusY - cornerOffset + cornerSize);
  ctx.moveTo(centerX - radiusX - cornerOffset, centerY - radiusY - cornerOffset);
  ctx.lineTo(centerX - radiusX - cornerOffset + cornerSize, centerY - radiusY - cornerOffset);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(centerX + radiusX + cornerOffset, centerY - radiusY - cornerOffset);
  ctx.lineTo(centerX + radiusX + cornerOffset, centerY - radiusY - cornerOffset + cornerSize);
  ctx.moveTo(centerX + radiusX + cornerOffset, centerY - radiusY - cornerOffset);
  ctx.lineTo(centerX + radiusX + cornerOffset - cornerSize, centerY - radiusY - cornerOffset);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX - cornerOffset, centerY + radiusY + cornerOffset);
  ctx.lineTo(centerX - radiusX - cornerOffset, centerY + radiusY + cornerOffset - cornerSize);
  ctx.moveTo(centerX - radiusX - cornerOffset, centerY + radiusY + cornerOffset);
  ctx.lineTo(centerX - radiusX - cornerOffset + cornerSize, centerY + radiusY + cornerOffset);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(centerX + radiusX + cornerOffset, centerY + radiusY + cornerOffset);
  ctx.lineTo(centerX + radiusX + cornerOffset, centerY + radiusY + cornerOffset - cornerSize);
  ctx.moveTo(centerX + radiusX + cornerOffset, centerY + radiusY + cornerOffset);
  ctx.lineTo(centerX + radiusX + cornerOffset - cornerSize, centerY + radiusY + cornerOffset);
  ctx.stroke();
}

export function getAgeVerificationResult(age: number): "approved" | "rejected" | "uncertain" {
  if (age < 18) return "rejected";
  if (age > 25) return "approved";
  return "uncertain";
}

export function calculateAgeConfidence(ages: number[]): {
  averageAge: number
  confidence: number
} {
  if (ages.length === 0) {
    return { averageAge: 0, confidence: 0 };
  }

  // Calculate average age
  const averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);

  // Calculate standard deviation
  const variance = ages.reduce((sum, age) => sum + Math.pow(age - averageAge, 2), 0) / ages.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate confidence score (0-1) based on standard deviation
  // Lower deviation = higher confidence
  const confidence = Math.max(0, Math.min(1, 1 - standardDeviation / 15));

  return {
    averageAge,
    confidence,
  };
}
