import * as faceapi from 'face-api.js'

export const loadFaceApiModels = async () => {
  const MODEL_URL = '/models'
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ])
    console.log('Face-api models loaded successfully')
  } catch (error) {
    console.error("Error loading face-api models:", error)
  }
}

