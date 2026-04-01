import { env } from '@huggingface/transformers';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import * as ort from 'onnxruntime-web';

import {
  adaptAndNormalizeFaceEmbedding,
  formatSupportedFaceEmbeddingDimensions,
  isSupportedFaceEmbeddingDimension,
} from '@/core/utils/face-embedding';

const ARCFACE_MODEL_PATH = process.env.NEXT_PUBLIC_ARCFACE_ONNX_PATH ?? '/models/arcface/onnx/model.onnx';
const ARCFACE_INPUT_SIZE = 112;
const MEDIAPIPE_WASM_PATH =
  process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_PATH ?? 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MEDIAPIPE_FACE_DETECTOR_MODEL_PATH =
  process.env.NEXT_PUBLIC_MEDIAPIPE_FACE_DETECTOR_MODEL_PATH ?? '/models/mediapipe/blaze_face_short_range.tflite';
const DEFAULT_MIN_DETECTION_CONFIDENCE = 0.6;
const DEFAULT_MIN_FACE_SIZE_PX = 80;
const FACE_CROP_EXPANSION_RATIO = 0.2;
const QUALITY_CANVAS_SIZE = 128;
const LAPLACIAN_LOW_VARIANCE = 120;
const LAPLACIAN_HIGH_VARIANCE = 900;

let arcFaceSessionPromise: Promise<ort.InferenceSession> | null = null;
let faceDetectorPromise: Promise<FaceDetector> | null = null;

type TensorLayout = 'NCHW' | 'NHWC';
type SessionWithInputMetadata = ort.InferenceSession & {
  inputMetadata?: Record<string, { dimensions?: Array<number | string> | readonly (number | string)[] }>;
};

type FaceDetection = {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  keypoints: Array<{ x: number; y: number; confidence: number }>;
};

type FaceEmbeddingExtractionOptions = {
  requireSingleFace?: boolean;
  maxFaces?: number;
  minFaceSize?: number;
  minDetectionConfidence?: number;
};

type ExtractedFaceEmbedding = {
  embedding: number[];
  faceCount: number;
  faceDetectionData: Record<string, unknown>;
};

function configureRuntime() {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = '/models';

  if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.wasmPaths = '/wasm/';
  }

  ort.env.wasm.wasmPaths = '/wasm/';
  ort.env.wasm.proxy = false;
  ort.env.wasm.simd = true;
}

async function getArcFaceSession(): Promise<ort.InferenceSession> {
  if (!arcFaceSessionPromise) {
    configureRuntime();

    arcFaceSessionPromise = ort.InferenceSession.create(ARCFACE_MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }

  return arcFaceSessionPromise;
}

async function getFaceDetector(): Promise<FaceDetector> {
  if (!faceDetectorPromise) {
    faceDetectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);

      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_FACE_DETECTOR_MODEL_PATH,
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3,
      });
    })();
  }

  return faceDetectorPromise;
}

function toNumericDimension(value: number | string | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function inferTensorLayoutFromMetadata(session: ort.InferenceSession, inputName: string): TensorLayout | null {
  const metadata = (session as SessionWithInputMetadata).inputMetadata?.[inputName];
  const dims = metadata?.dimensions;

  if (!dims || dims.length !== 4) {
    return null;
  }

  const channelSecond = toNumericDimension(dims[1]);
  const channelLast = toNumericDimension(dims[3]);

  if (channelSecond === 3) {
    return 'NCHW';
  }

  if (channelLast === 3) {
    return 'NHWC';
  }

  return null;
}

function isLikelyShapeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('invalid dimensions') || message.includes('expected:') || message.includes('got:');
}

function buildArcFaceInputTensor(imageBitmap: ImageBitmap, layout: TensorLayout): ort.Tensor {
  const canvas = document.createElement('canvas');
  canvas.width = ARCFACE_INPUT_SIZE;
  canvas.height = ARCFACE_INPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to initialize image preprocessing context for ArcFace.');
  }

  context.drawImage(imageBitmap, 0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);

  const imageData = context.getImageData(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE).data;
  const size = ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE;
  const inputData = new Float32Array(3 * size);

  for (let i = 0; i < size; i += 1) {
    const pixelOffset = i * 4;
    const normalizedRed = imageData[pixelOffset] / 127.5 - 1;
    const normalizedGreen = imageData[pixelOffset + 1] / 127.5 - 1;
    const normalizedBlue = imageData[pixelOffset + 2] / 127.5 - 1;

    if (layout === 'NCHW') {
      inputData[i] = normalizedRed;
      inputData[size + i] = normalizedGreen;
      inputData[2 * size + i] = normalizedBlue;
      continue;
    }

    const baseOffset = i * 3;
    inputData[baseOffset] = normalizedRed;
    inputData[baseOffset + 1] = normalizedGreen;
    inputData[baseOffset + 2] = normalizedBlue;
  }

  const dims =
    layout === 'NCHW' ? [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE] : [1, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE, 3];

  return new ort.Tensor('float32', inputData, dims);
}

async function extractArcFaceEmbedding(bitmap: ImageBitmap): Promise<number[]> {
  const session = await getArcFaceSession();
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const metadataLayout = inferTensorLayoutFromMetadata(session, inputName);
  const layoutAttempts: TensorLayout[] =
    metadataLayout === 'NHWC' ? ['NHWC', 'NCHW'] : metadataLayout === 'NCHW' ? ['NCHW', 'NHWC'] : ['NCHW', 'NHWC'];

  let result: ort.OnnxValue | undefined;

  for (let index = 0; index < layoutAttempts.length; index += 1) {
    const layout = layoutAttempts[index];
    const inputTensor = buildArcFaceInputTensor(bitmap, layout);

    try {
      const output = await session.run({ [inputName]: inputTensor });
      result = output[outputName];
      break;
    } catch (error) {
      const isLastAttempt = index === layoutAttempts.length - 1;
      if (!isLikelyShapeError(error) || isLastAttempt) {
        throw error;
      }
    }
  }

  if (!result || !ArrayBuffer.isView(result.data)) {
    throw new Error('ArcFace model returned invalid output tensor.');
  }

  const values = Array.from(result.data as ArrayLike<number>);
  if (values.length === 0) {
    throw new Error('ArcFace output produced an empty embedding vector.');
  }

  if (!isSupportedFaceEmbeddingDimension(values.length)) {
    throw new Error(
      `ArcFace output dimension ${values.length} is not supported. Expected ${formatSupportedFaceEmbeddingDimensions()}.`,
    );
  }

  return adaptAndNormalizeFaceEmbedding(values);
}

function normalizeExtractionOptions(
  options?: FaceEmbeddingExtractionOptions,
): Required<FaceEmbeddingExtractionOptions> {
  return {
    requireSingleFace: options?.requireSingleFace ?? true,
    maxFaces: options?.maxFaces ?? 1,
    minFaceSize: options?.minFaceSize ?? DEFAULT_MIN_FACE_SIZE_PX,
    minDetectionConfidence: options?.minDetectionConfidence ?? DEFAULT_MIN_DETECTION_CONFIDENCE,
  };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number') {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

function normalizeFaceDetection(rawDetection: unknown, imageWidth: number, imageHeight: number): FaceDetection | null {
  if (!rawDetection || typeof rawDetection !== 'object') {
    return null;
  }

  const candidate = rawDetection as {
    boundingBox?: { originX?: number; originY?: number; width?: number; height?: number };
    categories?: Array<{ score?: number }>;
    keypoints?: Array<{ x?: number; y?: number; score?: number }>;
  };

  const originX = toFiniteNumber(candidate.boundingBox?.originX);
  const originY = toFiniteNumber(candidate.boundingBox?.originY);
  const width = toFiniteNumber(candidate.boundingBox?.width);
  const height = toFiniteNumber(candidate.boundingBox?.height);

  if (originX === null || originY === null || width === null || height === null) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  const confidence = Math.max(0, Math.min(1, toFiniteNumber(candidate.categories?.[0]?.score) ?? 0));

  const keypoints = (candidate.keypoints ?? [])
    .map((keypoint) => {
      const normalizedX = toFiniteNumber(keypoint.x);
      const normalizedY = toFiniteNumber(keypoint.y);

      if (normalizedX === null || normalizedY === null) {
        return null;
      }

      const x = normalizedX <= 1 ? normalizedX * imageWidth : normalizedX;
      const y = normalizedY <= 1 ? normalizedY * imageHeight : normalizedY;
      const rawScore = toFiniteNumber(keypoint.score);
      const effectiveScore = rawScore !== null && rawScore > 0 ? rawScore : confidence;
      const pointConfidence = Math.max(0, Math.min(1, effectiveScore));

      return {
        x,
        y,
        confidence: pointConfidence,
      };
    })
    .filter((keypoint): keypoint is { x: number; y: number; confidence: number } => keypoint !== null);

  return {
    box: {
      x: originX,
      y: originY,
      width,
      height,
    },
    confidence,
    keypoints,
  };
}

async function detectFaces(
  imageBitmap: ImageBitmap,
  options: Required<FaceEmbeddingExtractionOptions>,
): Promise<FaceDetection[]> {
  const detector = await getFaceDetector();
  const detectionResult = detector.detect(imageBitmap) as { detections?: unknown[] };

  const detections = Array.isArray(detectionResult.detections) ? detectionResult.detections : [];

  return detections
    .map((detection) => normalizeFaceDetection(detection, imageBitmap.width, imageBitmap.height))
    .filter((detection): detection is FaceDetection => {
      if (!detection) {
        return false;
      }

      if (detection.confidence < options.minDetectionConfidence) {
        return false;
      }

      const shortestSide = Math.min(detection.box.width, detection.box.height);
      return shortestSide >= options.minFaceSize;
    });
}

function pickPrimaryFace(detections: FaceDetection[]): FaceDetection {
  return detections.reduce((best, current) => {
    const bestArea = best.box.width * best.box.height;
    const currentArea = current.box.width * current.box.height;

    if (current.confidence > best.confidence) {
      return current;
    }

    if (current.confidence === best.confidence && currentArea > bestArea) {
      return current;
    }

    return best;
  });
}

async function cropFaceBitmap(imageBitmap: ImageBitmap, detection: FaceDetection): Promise<ImageBitmap> {
  const centerX = detection.box.x + detection.box.width / 2;
  const centerY = detection.box.y + detection.box.height / 2;
  const expandedSide = Math.max(detection.box.width, detection.box.height) * (1 + FACE_CROP_EXPANSION_RATIO * 2);

  const sourceX = Math.max(0, centerX - expandedSide / 2);
  const sourceY = Math.max(0, centerY - expandedSide / 2);
  const sourceWidth = Math.min(expandedSide, imageBitmap.width - sourceX);
  const sourceHeight = Math.min(expandedSide, imageBitmap.height - sourceY);

  const safeX = Math.max(0, Math.floor(sourceX));
  const safeY = Math.max(0, Math.floor(sourceY));
  const safeWidth = Math.max(1, Math.floor(sourceWidth));
  const safeHeight = Math.max(1, Math.floor(sourceHeight));

  return createImageBitmap(imageBitmap, safeX, safeY, safeWidth, safeHeight);
}

function analyzeBitmapQuality(imageBitmap: ImageBitmap): {
  brightness: number;
  blur: number;
  focusScore: number;
  meanLuma: number;
} {
  const targetWidth = Math.max(32, Math.min(QUALITY_CANVAS_SIZE, imageBitmap.width));
  const targetHeight = Math.max(32, Math.min(QUALITY_CANVAS_SIZE, imageBitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {
      brightness: 0.5,
      blur: 0.2,
      focusScore: 0.8,
      meanLuma: 0.5,
    };
  }

  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  const imageData = context.getImageData(0, 0, targetWidth, targetHeight).data;

  const grayscale = new Float32Array(targetWidth * targetHeight);
  let totalLuma = 0;

  for (let i = 0; i < grayscale.length; i += 1) {
    const pixelOffset = i * 4;
    const red = imageData[pixelOffset];
    const green = imageData[pixelOffset + 1];
    const blue = imageData[pixelOffset + 2];

    const luma = 0.299 * red + 0.587 * green + 0.114 * blue;
    grayscale[i] = luma;
    totalLuma += luma;
  }

  const meanLumaRaw = totalLuma / grayscale.length;
  const meanLuma = Math.max(0, Math.min(1, meanLumaRaw / 255));

  // Laplacian variance approximates sharpness: higher variance means sharper face.
  let laplacianSum = 0;
  let laplacianSquaredSum = 0;
  let laplacianCount = 0;

  for (let y = 1; y < targetHeight - 1; y += 1) {
    const rowOffset = y * targetWidth;
    const rowAbove = (y - 1) * targetWidth;
    const rowBelow = (y + 1) * targetWidth;

    for (let x = 1; x < targetWidth - 1; x += 1) {
      const center = grayscale[rowOffset + x];
      const left = grayscale[rowOffset + x - 1];
      const right = grayscale[rowOffset + x + 1];
      const up = grayscale[rowAbove + x];
      const down = grayscale[rowBelow + x];

      const laplacian = 4 * center - left - right - up - down;
      laplacianSum += laplacian;
      laplacianSquaredSum += laplacian * laplacian;
      laplacianCount += 1;
    }
  }

  const laplacianMean = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
  const laplacianVariance =
    laplacianCount > 0 ? laplacianSquaredSum / laplacianCount - laplacianMean * laplacianMean : 0;

  const focusScore = Math.max(
    0,
    Math.min(1, (laplacianVariance - LAPLACIAN_LOW_VARIANCE) / (LAPLACIAN_HIGH_VARIANCE - LAPLACIAN_LOW_VARIANCE)),
  );
  const blur = 1 - focusScore;

  return {
    brightness: meanLuma,
    blur,
    focusScore,
    meanLuma,
  };
}

function toFaceDetectionData(
  detection: FaceDetection,
  faceCount: number,
  qualityMetrics: ReturnType<typeof analyzeBitmapQuality>,
): Record<string, unknown> {
  return {
    detector: 'mediapipe-face-detector',
    faceCount,
    box: {
      x: detection.box.x,
      y: detection.box.y,
      width: detection.box.width,
      height: detection.box.height,
    },
    description: {
      confidence: detection.confidence,
      brightness: qualityMetrics.brightness,
      blur: qualityMetrics.blur,
      focusScore: qualityMetrics.focusScore,
    },
    imageMetrics: {
      meanLuma: qualityMetrics.meanLuma,
    },
    landmarks: detection.keypoints.map((point) => [point.x, point.y, 0, point.confidence]),
    yaw: 0,
    pitch: 0,
    roll: 0,
  };
}

async function blobFromSource(input: { imageDataUrl?: string; imageUrl?: string }): Promise<Blob> {
  if (input.imageDataUrl?.trim()) {
    const response = await fetch(input.imageDataUrl.trim());
    return response.blob();
  }

  if (input.imageUrl?.trim()) {
    const response = await fetch(input.imageUrl.trim(), {
      method: 'GET',
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download image URL for embedding extraction.');
    }

    return response.blob();
  }

  throw new Error('Missing image source for embedding extraction.');
}

export async function extractFaceEmbedding(
  input: {
    imageDataUrl?: string;
    imageUrl?: string;
  },
  options?: FaceEmbeddingExtractionOptions,
): Promise<ExtractedFaceEmbedding> {
  const extractionOptions = normalizeExtractionOptions(options);
  const blob = await blobFromSource(input);
  const bitmap = await createImageBitmap(blob);

  try {
    const detections = await detectFaces(bitmap, extractionOptions);
    const faceCount = detections.length;

    if (faceCount === 0) {
      throw new Error('No face detected in the image. Please ensure your face is clearly visible in the photo.');
    }

    if (extractionOptions.requireSingleFace && faceCount !== 1) {
      throw new Error(`Detected ${faceCount} faces. Please provide an image with exactly one face.`);
    }

    if (!extractionOptions.requireSingleFace && faceCount > extractionOptions.maxFaces) {
      throw new Error(`Detected ${faceCount} faces. Maximum allowed is ${extractionOptions.maxFaces}.`);
    }

    const primaryFace = pickPrimaryFace(detections);
    const faceBitmap = await cropFaceBitmap(bitmap, primaryFace);

    let embedding: number[];
    let faceDetectionData: Record<string, unknown>;

    try {
      const qualityMetrics = analyzeBitmapQuality(faceBitmap);
      faceDetectionData = toFaceDetectionData(primaryFace, faceCount, qualityMetrics);
      embedding = await extractArcFaceEmbedding(faceBitmap);
    } finally {
      faceBitmap.close();
    }

    return {
      embedding,
      faceCount,
      faceDetectionData,
    };
  } finally {
    bitmap.close();
  }
}
