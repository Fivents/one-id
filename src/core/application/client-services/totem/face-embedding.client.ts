import { env } from '@huggingface/transformers';
import * as ort from 'onnxruntime-web';

import {
  adaptAndNormalizeFaceEmbedding,
  formatSupportedFaceEmbeddingDimensions,
  isSupportedFaceEmbeddingDimension,
} from '@/core/utils/face-embedding';

const ARCFACE_MODEL_PATH = process.env.NEXT_PUBLIC_ARCFACE_ONNX_PATH ?? '/models/arcface/onnx/model.onnx';
const ARCFACE_INPUT_SIZE = 112;

let arcFaceSessionPromise: Promise<ort.InferenceSession> | null = null;

type TensorLayout = 'NCHW' | 'NHWC';
type SessionWithInputMetadata = ort.InferenceSession & {
  inputMetadata?: Record<string, { dimensions?: Array<number | string> | readonly (number | string)[] }>;
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

async function detectFaceCount(imageBitmap: ImageBitmap): Promise<number> {
  const faceDetectorCtor = (
    globalThis as { FaceDetector?: new (options?: unknown) => { detect: (source: ImageBitmap) => Promise<unknown[]> } }
  ).FaceDetector;

  if (!faceDetectorCtor) {
    return 1;
  }

  try {
    const detector = new faceDetectorCtor({ fastMode: true, maxDetectedFaces: 5 });
    const detections = await detector.detect(imageBitmap);
    return detections.length;
  } catch {
    return 1;
  }
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

export async function extractFaceEmbedding(input: {
  imageDataUrl?: string;
  imageUrl?: string;
}): Promise<{ embedding: number[]; faceCount: number } | null> {
  const blob = await blobFromSource(input);
  const bitmap = await createImageBitmap(blob);

  try {
    const faceCount = await detectFaceCount(bitmap);

    if (faceCount === 0) {
      throw new Error('No face detected in the image. Please ensure your face is clearly visible in the photo.');
    }

    if (faceCount !== 1) {
      throw new Error(`Detected ${faceCount} faces. Please provide an image with exactly one face.`);
    }

    const embedding = await extractArcFaceEmbedding(bitmap);

    return {
      embedding,
      faceCount,
    };
  } finally {
    bitmap.close();
  }
}
