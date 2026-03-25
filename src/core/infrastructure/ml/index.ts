/**
 * ML Infrastructure Module Exports
 *
 * Face Recognition Pipeline:
 * 1. Detection (SCRFD) - Detect faces and extract 5 landmarks
 * 2. Alignment - Normalize face to 112x112 for embedding
 * 3. Embedding (ArcFace) - Extract 512-dim feature vector
 * 4. Liveness - Multi-frame anti-spoofing analysis
 */

// ONNX Runtime Engine
export { type ExecutionProvider, onnxEngine, type OnnxEngineConfig,OnnxRuntimeEngine } from './onnx-runtime';

// Face Detection (SCRFD)
export { disposeSCRFD, getSCRFD, isScrfdDetection, SCRFD, type ScrfdConfig,type ScrfdDetection } from './scrfd';

// Face Alignment
export {
  alignFace,
  calculateFaceQuality,
  isFaceSuitable,
  type Landmarks5,
  parseLandmarks,
  type Point2D,
  preprocessForArcFace,
} from './face-alignment';

// Face Embedding (ArcFace)
export {
  type ArcFaceConfig,
  ArcFaceEmbedder,
  disposeArcFaceEmbedder,
  type EmbeddingResult,
  getArcFaceEmbedder,
} from './arcface';

// Liveness Detection
export {
  getLivenessDetector,
  type LivenessConfig,
  LivenessDetector,
  type LivenessFrame,
  type LivenessResult,
  resetLivenessDetector,
} from './liveness';
