// Import face-api.js knihovny
import * as faceapi from 'face-api.js';

// Export všech potřebných funkcí
export const { 
  nets, 
  detectAllFaces,
  detectSingleFace,
  TinyFaceDetectorOptions,
  extractFaces,
  Rect
} = faceapi;

// Pro jednoduchost exportujeme celý objekt faceapi, abychom se vyhnuli problémům s typy
export * from 'face-api.js';

// Export výchozího objektu
export default faceapi; 