/// <reference lib="webworker" />

/**
 * Totem Face Recognition Worker
 *
 * Production-ready facial recognition pipeline:
 * 1. SCRFD detection (InsightFace)
 * 2. Multi-frame liveness detection
 * 3. ArcFace embedding extraction (512-dim)
 *
 * All inference runs in this worker thread via ONNX Runtime Web.
 * Main thread is never blocked.
 */

import * as ort from 'onnxruntime-web';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface WorkerInitPayload {
  maxFaces: number;
  minFaceSize: number;
  livenessEnabled: boolean;
  livenessThreshold: number;
  confidenceThreshold: number;
  modelsPath?: string;
}

interface WorkerAnalyzePayload {
  bitmap: ImageBitmap;
}

type WorkerRequest =
  | { id: number; type: 'init'; payload: WorkerInitPayload }
  | { id: number; type: 'analyze'; payload: WorkerAnalyzePayload }
  | { id: number; type: 'dispose' };

interface WorkerResponse {
  id: number;
  ok: boolean;
  error?: string;
  data?: unknown;
}

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceQualityMetadata {
  brightness: number;
  blurriness: number;
  faceSize: number;
  headPoseYaw: number;
  headPosePitch: number;
  headPoseRoll: number;
  landmarkConfidence: number;
}

interface FaceAnalysisResult {
  faceCount: number;
  face: {
    box: FaceBox;
    isBigEnough: boolean;
    embedding: number[];
    livenessScore: number;
    qualityScore: number;
    qualityMetadata: FaceQualityMetadata;
    landmarks: number[][];
    detectionScore: number;
  } | null;
  liveness: {
    isLive: boolean;
    score: number;
    blinkDetected: boolean;
    headMovementDetected: boolean;
    framesAnalyzed: number;
  } | null;
  timings: {
    detectionMs: number;
    embeddingMs: number;
    totalMs: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const SCRFD_MODEL = 'scrfd_10g_bnkps.onnx';
const ARCFACE_MODEL = 'w600k_r50.onnx';
const SCRFD_INPUT_SIZE = 640;
const ARCFACE_INPUT_SIZE = 112;
const EMBEDDING_DIM = 512;

// ArcFace alignment template (112x112)
const ARCFACE_TEMPLATE = [
  [38.2946, 51.6963], // left eye
  [73.5318, 51.5014], // right eye
  [56.0252, 71.7366], // nose
  [41.5493, 92.3655], // mouth left
  [70.7299, 92.2041], // mouth right
];

// ═══════════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════════

let config: WorkerInitPayload | null = null;
let initialized = false;

// ONNX Sessions
let scrfdSession: ort.InferenceSession | null = null;
let arcfaceSession: ort.InferenceSession | null = null;

// Liveness state
const livenessFrames: {
  timestamp: number;
  landmarks: number[][];
  headPose: { yaw: number; pitch: number; roll: number };
}[] = [];
const blinkHistory: boolean[] = [];
let lastEyeState = { leftOpen: true, rightOpen: true };

// ═══════════════════════════════════════════════════════════════════════════════
// Message Handler
// ═══════════════════════════════════════════════════════════════════════════════

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    switch (request.type) {
      case 'init':
        await handleInit(request.payload);
        respond(request.id, true);
        break;

      case 'analyze':
        const result = await handleAnalyze(request.payload);
        respond(request.id, true, result);
        break;

      case 'dispose':
        await handleDispose();
        respond(request.id, true);
        break;

      default: {
        const _exhaustive: never = request;
        respond((_exhaustive as WorkerRequest).id, false, undefined, 'Unknown request type');
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FaceWorker] Error:', message);
    respond(request.id, false, undefined, message);
  }
};

function respond(id: number, ok: boolean, data?: unknown, error?: string): void {
  const response: WorkerResponse = { id, ok };
  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  self.postMessage(response);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════════════

async function handleInit(payload: WorkerInitPayload): Promise<void> {
  if (initialized) {
    console.log('[FaceWorker] Already initialized, skipping');
    return;
  }

  config = payload;
  const modelsPath = payload.modelsPath || '/models';

  console.log('[FaceWorker] Initializing with config:', {
    maxFaces: payload.maxFaces,
    minFaceSize: payload.minFaceSize,
    livenessEnabled: payload.livenessEnabled,
  });

  // Configure ONNX Runtime WASM paths for Web Worker context
  // Workers need absolute URLs since they don't have the same base URL as the main page
  const origin = self.location.origin;
  const wasmPath = `${origin}/wasm/`;

  ort.env.wasm.wasmPaths = wasmPath;
  ort.env.wasm.numThreads = 1; // Single thread is more stable in workers
  ort.env.wasm.simd = true;

  // Disable proxy worker since we're already in a worker
  ort.env.wasm.proxy = false;

  console.log('[FaceWorker] WASM path:', wasmPath);

  // Load models
  const startTime = performance.now();

  try {
    // Load SCRFD
    console.log('[FaceWorker] Loading SCRFD model...');
    const scrfdUrl = `${origin}${modelsPath}/${SCRFD_MODEL}`;
    console.log('[FaceWorker] SCRFD URL:', scrfdUrl);

    scrfdSession = await ort.InferenceSession.create(scrfdUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    console.log(`[FaceWorker] SCRFD loaded in ${(performance.now() - startTime).toFixed(0)}ms`);

    // Load ArcFace
    const arcfaceStart = performance.now();
    console.log('[FaceWorker] Loading ArcFace model...');
    const arcfaceUrl = `${origin}${modelsPath}/${ARCFACE_MODEL}`;
    console.log('[FaceWorker] ArcFace URL:', arcfaceUrl);

    arcfaceSession = await ort.InferenceSession.create(arcfaceUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    console.log(`[FaceWorker] ArcFace loaded in ${(performance.now() - arcfaceStart).toFixed(0)}ms`);

    // Warm up models
    await warmupModels();

    initialized = true;
    console.log(`[FaceWorker] Initialization complete in ${(performance.now() - startTime).toFixed(0)}ms`);
  } catch (error) {
    console.error('[FaceWorker] Model loading failed:', error);
    throw error;
  }
}

async function warmupModels(): Promise<void> {
  // Warmup SCRFD
  if (scrfdSession) {
    const dummyInput = new Float32Array(3 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE);
    const tensor = new ort.Tensor('float32', dummyInput, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
    await scrfdSession.run({ [scrfdSession.inputNames[0]]: tensor });
  }

  // Warmup ArcFace
  if (arcfaceSession) {
    const dummyInput = new Float32Array(3 * ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE);
    const tensor = new ort.Tensor('float32', dummyInput, [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE]);
    await arcfaceSession.run({ [arcfaceSession.inputNames[0]]: tensor });
  }

  console.log('[FaceWorker] Models warmed up');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Face Analysis
// ═══════════════════════════════════════════════════════════════════════════════

async function handleAnalyze(payload: WorkerAnalyzePayload): Promise<FaceAnalysisResult> {
  if (!initialized || !scrfdSession || !arcfaceSession || !config) {
    throw new Error('Worker not initialized');
  }

  const totalStart = performance.now();
  const { bitmap } = payload;

  // 1. Face Detection with SCRFD
  const detectionStart = performance.now();
  const detections = await detectFaces(bitmap);
  const detectionMs = performance.now() - detectionStart;

  // No faces detected
  if (detections.length === 0) {
    bitmap.close();
    return {
      faceCount: 0,
      face: null,
      liveness: null,
      timings: {
        detectionMs,
        embeddingMs: 0,
        totalMs: performance.now() - totalStart,
      },
    };
  }

  // Too many faces
  if (detections.length > config.maxFaces) {
    bitmap.close();
    return {
      faceCount: detections.length,
      face: null,
      liveness: null,
      timings: {
        detectionMs,
        embeddingMs: 0,
        totalMs: performance.now() - totalStart,
      },
    };
  }

  // Get best face (highest score)
  const bestFace = detections.reduce((a, b) => (a.score > b.score ? a : b));

  // Check minimum face size
  const isBigEnough = bestFace.box.width >= config.minFaceSize && bestFace.box.height >= config.minFaceSize;

  // Calculate quality metadata
  const qualityMetadata = calculateQualityMetadata(bestFace, bitmap.width, bitmap.height);
  const qualityScore = calculateQualityScore(qualityMetadata);

  // Update liveness frames
  if (config.livenessEnabled) {
    addLivenessFrame(bestFace.landmarks, qualityMetadata);
  }

  // 2. Extract embedding if face is good enough
  let embedding: number[] = [];
  let embeddingMs = 0;

  if (isBigEnough && qualityScore >= 0.5) {
    const embeddingStart = performance.now();
    embedding = await extractEmbedding(bitmap, bestFace.landmarks);
    embeddingMs = performance.now() - embeddingStart;
  }

  // 3. Evaluate liveness
  const liveness = config.livenessEnabled ? evaluateLiveness() : null;

  bitmap.close();

  return {
    faceCount: detections.length,
    face: {
      box: bestFace.box,
      isBigEnough,
      embedding,
      livenessScore: liveness?.score ?? 1.0,
      qualityScore,
      qualityMetadata,
      landmarks: bestFace.landmarks,
      detectionScore: bestFace.score,
    },
    liveness,
    timings: {
      detectionMs,
      embeddingMs,
      totalMs: performance.now() - totalStart,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRFD Face Detection
// ═══════════════════════════════════════════════════════════════════════════════

interface Detection {
  box: FaceBox;
  score: number;
  landmarks: number[][];
}

async function detectFaces(image: ImageBitmap): Promise<Detection[]> {
  if (!scrfdSession) throw new Error('SCRFD not loaded');

  // Preprocess image
  const { tensor, scaleX, scaleY, padX, padY } = preprocessForScrfd(image);

  // Run inference
  const results = await scrfdSession.run({ [scrfdSession.inputNames[0]]: tensor });

  // Parse outputs
  return parseScrfdOutputs(results, scaleX, scaleY, padX, padY);
}

function preprocessForScrfd(image: ImageBitmap): {
  tensor: ort.Tensor;
  scaleX: number;
  scaleY: number;
  padX: number;
  padY: number;
} {
  const { width, height } = image;

  // Calculate scale to fit in SCRFD_INPUT_SIZE
  const scale = Math.min(SCRFD_INPUT_SIZE / width, SCRFD_INPUT_SIZE / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  const padX = (SCRFD_INPUT_SIZE - newWidth) / 2;
  const padY = (SCRFD_INPUT_SIZE - newHeight) / 2;

  // Create canvas
  const canvas = new OffscreenCanvas(SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE);
  const ctx = canvas.getContext('2d')!;

  // Fill with gray padding
  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE);

  // Draw resized image
  ctx.drawImage(image, padX, padY, newWidth, newHeight);

  // Get image data and convert to tensor
  const imageData = ctx.getImageData(0, 0, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE);
  const data = imageData.data;
  const size = SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE;
  const tensorData = new Float32Array(3 * size);

  for (let i = 0; i < size; i++) {
    const idx = i * 4;
    tensorData[i] = data[idx] / 255; // R
    tensorData[size + i] = data[idx + 1] / 255; // G
    tensorData[2 * size + i] = data[idx + 2] / 255; // B
  }

  return {
    tensor: new ort.Tensor('float32', tensorData, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]),
    scaleX: 1 / scale,
    scaleY: 1 / scale,
    padX,
    padY,
  };
}

function parseScrfdOutputs(
  outputs: ort.InferenceSession.ReturnType,
  scaleX: number,
  scaleY: number,
  padX: number,
  padY: number,
): Detection[] {
  const detections: Detection[] = [];
  const scoreThreshold = 0.5;
  const nmsThreshold = 0.4;

  // SCRFD outputs scores, bboxes, keypoints per stride
  const outputNames = Object.keys(outputs);

  // Try to find outputs by name pattern
  const strides = [8, 16, 32];

  for (const stride of strides) {
    // Find matching outputs for this stride
    const scoreKey = outputNames.find((n) => n.toLowerCase().includes('score') && n.includes(String(stride)));
    const bboxKey = outputNames.find((n) => n.toLowerCase().includes('bbox') && n.includes(String(stride)));
    const kpsKey = outputNames.find(
      (n) => (n.toLowerCase().includes('kps') || n.toLowerCase().includes('landmark')) && n.includes(String(stride)),
    );

    if (!scoreKey || !bboxKey) continue;

    const scores = outputs[scoreKey].data as Float32Array;
    const bboxes = outputs[bboxKey].data as Float32Array;
    const kps = kpsKey ? (outputs[kpsKey].data as Float32Array) : null;

    const fmapSize = SCRFD_INPUT_SIZE / stride;
    const numAnchors = 2;

    for (let y = 0; y < fmapSize; y++) {
      for (let x = 0; x < fmapSize; x++) {
        for (let anchor = 0; anchor < numAnchors; anchor++) {
          const idx = (y * fmapSize + x) * numAnchors + anchor;
          const score = scores[idx];

          if (score < scoreThreshold) continue;

          // Decode bbox
          const bboxIdx = idx * 4;
          const cx = (x + 0.5) * stride + bboxes[bboxIdx] * stride - padX;
          const cy = (y + 0.5) * stride + bboxes[bboxIdx + 1] * stride - padY;
          const w = Math.exp(bboxes[bboxIdx + 2]) * stride;
          const h = Math.exp(bboxes[bboxIdx + 3]) * stride;

          // Decode landmarks
          const landmarks: number[][] = [];
          if (kps) {
            const kpsIdx = idx * 10;
            for (let k = 0; k < 5; k++) {
              const lx = ((x + kps[kpsIdx + k * 2]) * stride - padX) * scaleX;
              const ly = ((y + kps[kpsIdx + k * 2 + 1]) * stride - padY) * scaleY;
              landmarks.push([lx, ly]);
            }
          }

          detections.push({
            box: {
              x: (cx - w / 2) * scaleX,
              y: (cy - h / 2) * scaleY,
              width: w * scaleX,
              height: h * scaleY,
            },
            score,
            landmarks,
          });
        }
      }
    }
  }

  // If no stride-specific outputs found, try generic output format
  if (detections.length === 0 && outputNames.length > 0) {
    // Try first output as concatenated results
    const output = outputs[outputNames[0]];
    const data = output.data as Float32Array;
    const dims = output.dims;

    // Format: [1, N, 15] where 15 = 4 (bbox) + 1 (score) + 10 (landmarks)
    if (dims.length === 3 && dims[2] >= 5) {
      const numDets = dims[1];
      const stride = dims[2];

      for (let i = 0; i < numDets; i++) {
        const offset = i * stride;
        const score = stride === 15 ? data[offset + 4] : data[offset + stride - 1];

        if (score < scoreThreshold) continue;

        const x1 = (data[offset] - padX) * scaleX;
        const y1 = (data[offset + 1] - padY) * scaleY;
        const x2 = (data[offset + 2] - padX) * scaleX;
        const y2 = (data[offset + 3] - padY) * scaleY;

        const landmarks: number[][] = [];
        if (stride >= 15) {
          for (let k = 0; k < 5; k++) {
            landmarks.push([(data[offset + 5 + k * 2] - padX) * scaleX, (data[offset + 6 + k * 2] - padY) * scaleY]);
          }
        }

        detections.push({
          box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
          score,
          landmarks,
        });
      }
    }
  }

  // Apply NMS
  return applyNMS(detections, nmsThreshold);
}

function applyNMS(detections: Detection[], threshold: number): Detection[] {
  if (detections.length === 0) return [];

  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];

  while (sorted.length > 0) {
    const best = sorted.shift()!;
    kept.push(best);

    for (let i = sorted.length - 1; i >= 0; i--) {
      if (calculateIoU(best.box, sorted[i].box) > threshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return kept;
}

function calculateIoU(box1: FaceBox, box2: FaceBox): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 < x1 || y2 < y1) return 0;

  const intersection = (x2 - x1) * (y2 - y1);
  const union = box1.width * box1.height + box2.width * box2.height - intersection;

  return intersection / union;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ArcFace Embedding Extraction
// ═══════════════════════════════════════════════════════════════════════════════

async function extractEmbedding(image: ImageBitmap, landmarks: number[][]): Promise<number[]> {
  if (!arcfaceSession) throw new Error('ArcFace not loaded');
  if (landmarks.length < 5) return [];

  // Align face
  const aligned = alignFace(image, landmarks);

  // Preprocess for ArcFace
  const tensor = preprocessForArcFace(aligned);

  // Run inference
  const results = await arcfaceSession.run({ [arcfaceSession.inputNames[0]]: tensor });
  const output = results[arcfaceSession.outputNames[0]];
  const embedding = new Float32Array(output.data as Float32Array);

  // L2 normalize
  return normalizeL2(embedding);
}

function alignFace(image: ImageBitmap, landmarks: number[][]): OffscreenCanvas {
  // Estimate similarity transform
  const matrix = estimateSimilarityTransform(landmarks, ARCFACE_TEMPLATE);

  // Create aligned canvas
  const canvas = new OffscreenCanvas(ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);
  const ctx = canvas.getContext('2d')!;

  // Apply transform and draw
  warpAffine(image, ctx, matrix);

  return canvas;
}

function estimateSimilarityTransform(src: number[][], dst: number[][]): number[][] {
  const n = Math.min(src.length, dst.length);

  // Calculate centroids
  let srcMeanX = 0,
    srcMeanY = 0,
    dstMeanX = 0,
    dstMeanY = 0;
  for (let i = 0; i < n; i++) {
    srcMeanX += src[i][0];
    srcMeanY += src[i][1];
    dstMeanX += dst[i][0];
    dstMeanY += dst[i][1];
  }
  srcMeanX /= n;
  srcMeanY /= n;
  dstMeanX /= n;
  dstMeanY /= n;

  // Calculate covariance
  let cov00 = 0,
    cov01 = 0,
    cov10 = 0,
    cov11 = 0,
    srcVar = 0;
  for (let i = 0; i < n; i++) {
    const sx = src[i][0] - srcMeanX;
    const sy = src[i][1] - srcMeanY;
    const dx = dst[i][0] - dstMeanX;
    const dy = dst[i][1] - dstMeanY;

    cov00 += sx * dx;
    cov01 += sx * dy;
    cov10 += sy * dx;
    cov11 += sy * dy;
    srcVar += sx * sx + sy * sy;
  }

  const a = cov00 + cov11;
  const b = cov10 - cov01;
  const scale = Math.sqrt(a * a + b * b) / srcVar;
  const cos = a / (srcVar * scale);
  const sin = b / (srcVar * scale);

  const tx = dstMeanX - scale * (cos * srcMeanX - sin * srcMeanY);
  const ty = dstMeanY - scale * (sin * srcMeanX + cos * srcMeanY);

  return [
    [scale * cos, -scale * sin, tx],
    [scale * sin, scale * cos, ty],
  ];
}

function warpAffine(image: ImageBitmap, ctx: OffscreenCanvasRenderingContext2D, matrix: number[][]): void {
  // Draw source image to temp canvas
  const srcCanvas = new OffscreenCanvas(image.width, image.height);
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(image, 0, 0);

  const srcData = srcCtx.getImageData(0, 0, image.width, image.height).data;
  const dstData = ctx.createImageData(ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);

  // Invert transform matrix
  const a = matrix[0][0],
    b = matrix[0][1],
    c = matrix[0][2];
  const d = matrix[1][0],
    e = matrix[1][1],
    f = matrix[1][2];
  const det = a * e - b * d;
  const invA = e / det,
    invB = -b / det,
    invC = (b * f - e * c) / det;
  const invD = -d / det,
    invE = a / det,
    invF = (d * c - a * f) / det;

  // Bilinear interpolation
  for (let dy = 0; dy < ARCFACE_INPUT_SIZE; dy++) {
    for (let dx = 0; dx < ARCFACE_INPUT_SIZE; dx++) {
      const sx = invA * dx + invB * dy + invC;
      const sy = invD * dx + invE * dy + invF;

      const x0 = Math.floor(sx),
        y0 = Math.floor(sy);
      const x1 = x0 + 1,
        y1 = y0 + 1;

      if (x0 >= 0 && x1 < image.width && y0 >= 0 && y1 < image.height) {
        const fx = sx - x0,
          fy = sy - y0;
        const idx00 = (y0 * image.width + x0) * 4;
        const idx01 = (y0 * image.width + x1) * 4;
        const idx10 = (y1 * image.width + x0) * 4;
        const idx11 = (y1 * image.width + x1) * 4;
        const dstIdx = (dy * ARCFACE_INPUT_SIZE + dx) * 4;

        for (let ch = 0; ch < 4; ch++) {
          const v00 = srcData[idx00 + ch];
          const v01 = srcData[idx01 + ch];
          const v10 = srcData[idx10 + ch];
          const v11 = srcData[idx11 + ch];
          const v0 = v00 * (1 - fx) + v01 * fx;
          const v1 = v10 * (1 - fx) + v11 * fx;
          dstData.data[dstIdx + ch] = v0 * (1 - fy) + v1 * fy;
        }
      }
    }
  }

  ctx.putImageData(dstData, 0, 0);
}

function preprocessForArcFace(canvas: OffscreenCanvas): ort.Tensor {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);
  const data = imageData.data;
  const size = ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE;
  const tensorData = new Float32Array(3 * size);

  // Normalize to [-1, 1] in CHW format
  for (let i = 0; i < size; i++) {
    const idx = i * 4;
    tensorData[i] = data[idx] / 127.5 - 1; // R
    tensorData[size + i] = data[idx + 1] / 127.5 - 1; // G
    tensorData[2 * size + i] = data[idx + 2] / 127.5 - 1; // B
  }

  return new ort.Tensor('float32', tensorData, [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE]);
}

function normalizeL2(embedding: Float32Array): number[] {
  let norm = 0;
  for (let i = 0; i < embedding.length; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);

  const result: number[] = new Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) {
    result[i] = embedding[i] / norm;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Quality Assessment
// ═══════════════════════════════════════════════════════════════════════════════

function calculateQualityMetadata(face: Detection, imageWidth: number, imageHeight: number): FaceQualityMetadata {
  const landmarks = face.landmarks;

  // Calculate head pose from landmarks
  const headPose = estimateHeadPose(landmarks);

  // Calculate face size relative to image
  const faceSize = Math.max(face.box.width, face.box.height);
  const relativeSize = faceSize / Math.min(imageWidth, imageHeight);

  // Estimate brightness (would need actual pixel analysis)
  const brightness = 0.7; // Placeholder

  // Estimate blurriness from detection confidence
  const blurriness = 1 - face.score;

  // Landmark confidence from detection score
  const landmarkConfidence = face.score;

  return {
    brightness,
    blurriness,
    faceSize: relativeSize,
    headPoseYaw: headPose.yaw,
    headPosePitch: headPose.pitch,
    headPoseRoll: headPose.roll,
    landmarkConfidence,
  };
}

function estimateHeadPose(landmarks: number[][]): { yaw: number; pitch: number; roll: number } {
  if (landmarks.length < 5) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const leftEye = landmarks[0];
  const rightEye = landmarks[1];
  const nose = landmarks[2];

  // Roll from eye angle
  const eyeAngle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
  const roll = (eyeAngle * 180) / Math.PI;

  // Yaw from nose position
  const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;
  const eyeDistance = Math.sqrt(Math.pow(rightEye[0] - leftEye[0], 2) + Math.pow(rightEye[1] - leftEye[1], 2));
  const noseOffset = (nose[0] - eyeCenterX) / eyeDistance;
  const yaw = noseOffset * 45;

  // Pitch (simplified)
  const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
  const noseToEyeY = nose[1] - eyeCenterY;
  const pitch = (noseToEyeY / eyeDistance - 0.5) * 30;

  return { yaw, pitch, roll };
}

function calculateQualityScore(metadata: FaceQualityMetadata): number {
  // Weights for each factor
  const weights = {
    brightness: 0.15,
    blurriness: 0.2,
    faceSize: 0.25,
    headPose: 0.25,
    landmarkConfidence: 0.15,
  };

  // Brightness score (0.3-0.8 is ideal)
  const brightnessScore = metadata.brightness >= 0.3 && metadata.brightness <= 0.8 ? 1.0 : 0.6;

  // Blurriness score (lower is better)
  const blurrinessScore = 1 - metadata.blurriness;

  // Face size score (larger is better, up to a point)
  const sizeScore = Math.min(metadata.faceSize * 2, 1.0);

  // Head pose score (frontal is better)
  const poseScore =
    1 -
    Math.min(
      (Math.abs(metadata.headPoseYaw) + Math.abs(metadata.headPosePitch) + Math.abs(metadata.headPoseRoll)) / 90,
      1,
    );

  // Combine scores
  return (
    brightnessScore * weights.brightness +
    blurrinessScore * weights.blurriness +
    sizeScore * weights.faceSize +
    poseScore * weights.headPose +
    metadata.landmarkConfidence * weights.landmarkConfidence
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Liveness Detection
// ═══════════════════════════════════════════════════════════════════════════════

function addLivenessFrame(landmarks: number[][], quality: FaceQualityMetadata): void {
  const headPose = {
    yaw: quality.headPoseYaw,
    pitch: quality.headPosePitch,
    roll: quality.headPoseRoll,
  };

  livenessFrames.push({
    timestamp: Date.now(),
    landmarks,
    headPose,
  });

  // Keep bounded
  if (livenessFrames.length > 30) {
    livenessFrames.shift();
  }

  // Track eye blinks (simplified for 5-point landmarks)
  updateBlinkState(landmarks);
}

function updateBlinkState(landmarks: number[][]): void {
  if (landmarks.length < 5) return;

  // For 5-point landmarks, we can't directly measure eye openness
  // Use head pose variance as proxy for natural movement
  const currentOpen = { leftOpen: true, rightOpen: true };

  // Detect blink transition
  if (lastEyeState.leftOpen && !currentOpen.leftOpen) {
    blinkHistory.push(true);
  }

  if (blinkHistory.length > 20) {
    blinkHistory.shift();
  }

  lastEyeState = currentOpen;
}

function evaluateLiveness(): {
  isLive: boolean;
  score: number;
  blinkDetected: boolean;
  headMovementDetected: boolean;
  framesAnalyzed: number;
} {
  if (livenessFrames.length < 5) {
    return {
      isLive: false,
      score: 0,
      blinkDetected: false,
      headMovementDetected: false,
      framesAnalyzed: livenessFrames.length,
    };
  }

  // Check for head movement
  const poses = livenessFrames.map((f) => f.headPose);
  const yawVariance = variance(poses.map((p) => p.yaw));
  const pitchVariance = variance(poses.map((p) => p.pitch));
  const headMovementDetected = yawVariance > 2 || pitchVariance > 2;

  // Check for blinks
  const blinkDetected = blinkHistory.some((b) => b);

  // Calculate texture/stability score
  const textureScore = calculateTextureScore();

  // Combine scores
  let score = 0;
  if (headMovementDetected) score += 0.35;
  if (blinkDetected) score += 0.25;
  score += textureScore * 0.4;

  const threshold = config?.livenessThreshold ?? 0.7;

  return {
    isLive: score >= threshold,
    score,
    blinkDetected,
    headMovementDetected,
    framesAnalyzed: livenessFrames.length,
  };
}

function calculateTextureScore(): number {
  if (livenessFrames.length < 3) return 0.5;

  // Measure landmark stability
  const recent = livenessFrames.slice(-5);
  let totalVariance = 0;

  for (let i = 0; i < 5; i++) {
    const points = recent.map((f) => f.landmarks[i] || [0, 0]);
    const xVar = variance(points.map((p) => p[0]));
    const yVar = variance(points.map((p) => p[1]));
    totalVariance += xVar + yVar;
  }

  const avgVariance = totalVariance / 10;

  // Natural micro-movements: 0.5-5 pixels variance
  if (avgVariance < 0.2) return 0.3; // Too stable - photo
  if (avgVariance > 20) return 0.4; // Too jittery - noise
  if (avgVariance >= 0.5 && avgVariance <= 5) return 0.9;

  return 0.6;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cleanup
// ═══════════════════════════════════════════════════════════════════════════════

async function handleDispose(): Promise<void> {
  if (scrfdSession) {
    scrfdSession.release();
    scrfdSession = null;
  }

  if (arcfaceSession) {
    arcfaceSession.release();
    arcfaceSession = null;
  }

  livenessFrames.length = 0;
  blinkHistory.length = 0;
  initialized = false;
  config = null;

  console.log('[FaceWorker] Disposed');
}
