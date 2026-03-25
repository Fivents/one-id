/**
 * SCRFD Face Detector
 *
 * SCRFD (Sample-level Classifier with Receptive Field Division)
 * - InsightFace state-of-the-art detector
 * - Optimized for small faces and varied poses
 * - 5-point landmark detection (eyes, nose, mouth corners)
 *
 * Implementation: ONNX Runtime Web
 * - WebGPU/WebGL/WASM execution providers
 * - Runs in main thread or Web Worker
 *
 * Model: scrfd_10g_bnkps.onnx (10G with keypoints)
 * Input: 640x640 RGB (resized with padding)
 * Output: Boxes + Scores + Landmarks
 */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

import { onnxEngine } from './onnx-runtime';

export interface ScrfdDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
  landmarks: number[][];
}

export interface ScrfdConfig {
  modelName?: string;
  inputSize?: number;
  scoreThreshold?: number;
  nmsThreshold?: number;
}

const DEFAULT_MODEL_NAME = 'scrfd_10g_bnkps.onnx';
const DEFAULT_INPUT_SIZE = 640;
const DEFAULT_SCORE_THRESHOLD = 0.5;
const DEFAULT_NMS_THRESHOLD = 0.4;

// Feature map strides for SCRFD
const STRIDES = [8, 16, 32];

export class SCRFD {
  private modelName: string;
  private inputSize: number;
  private scoreThreshold: number;
  private nmsThreshold: number;
  private session: InferenceSession | null = null;
  private loaded = false;

  constructor(config?: ScrfdConfig) {
    this.modelName = config?.modelName || DEFAULT_MODEL_NAME;
    this.inputSize = config?.inputSize || DEFAULT_INPUT_SIZE;
    this.scoreThreshold = config?.scoreThreshold || DEFAULT_SCORE_THRESHOLD;
    this.nmsThreshold = config?.nmsThreshold || DEFAULT_NMS_THRESHOLD;
  }

  /**
   * Load SCRFD model
   */
  async load(modelPath?: string): Promise<void> {
    if (this.loaded) return;

    try {
      const path = modelPath || `/models/${this.modelName}`;
      this.session = await onnxEngine.loadModel(this.modelName, { modelPath: path });
      this.loaded = true;
      console.log(`[SCRFD] Model loaded: ${this.modelName}`);
    } catch (error) {
      console.error('[SCRFD] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean {
    return this.loaded && this.session !== null;
  }

  /**
   * Detect faces in image
   */
  async detect(image: CanvasImageSource | OffscreenCanvas | ImageBitmap): Promise<ScrfdDetection[]> {
    if (!this.session) {
      throw new Error('SCRFD model not loaded. Call load() first.');
    }

    // Preprocess image
    const { tensor, scaleX, scaleY, padX, padY } = await this.preprocess(image);

    // Run inference
    const inputName = this.session.inputNames[0];
    const feeds: Record<string, Tensor> = { [inputName]: tensor };
    const results = await this.session.run(feeds);

    // Postprocess outputs
    const detections = this.postprocess(results, scaleX, scaleY, padX, padY);

    // Apply NMS
    return this.nms(detections);
  }

  /**
   * Preprocess image to model input format
   */
  private async preprocess(image: CanvasImageSource | OffscreenCanvas | ImageBitmap): Promise<{
    tensor: Tensor;
    scaleX: number;
    scaleY: number;
    padX: number;
    padY: number;
  }> {
    // Get image dimensions
    let width: number, height: number;
    if (image instanceof ImageBitmap) {
      width = image.width;
      height = image.height;
    } else if (image instanceof OffscreenCanvas) {
      width = image.width;
      height = image.height;
    } else if ('naturalWidth' in image) {
      width = (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width;
      height = (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height;
    } else {
      width = (image as HTMLVideoElement | HTMLCanvasElement).width;
      height = (image as HTMLVideoElement | HTMLCanvasElement).height;
    }

    // Calculate scaling to fit in input size while maintaining aspect ratio
    const scale = Math.min(this.inputSize / width, this.inputSize / height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    // Calculate padding
    const padX = (this.inputSize - newWidth) / 2;
    const padY = (this.inputSize - newHeight) / 2;

    // Create canvas for preprocessing
    const canvas = new OffscreenCanvas(this.inputSize, this.inputSize);
    const ctx = canvas.getContext('2d')!;

    // Fill with gray (114, 114, 114) - standard SCRFD padding color
    ctx.fillStyle = 'rgb(114, 114, 114)';
    ctx.fillRect(0, 0, this.inputSize, this.inputSize);

    // Draw resized image centered
    ctx.drawImage(image, padX, padY, newWidth, newHeight);

    // Get image data
    const imageData = ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const data = imageData.data;

    // Convert to CHW format and normalize to [0, 1]
    const size = this.inputSize * this.inputSize;
    const tensorData = new Float32Array(3 * size);

    for (let i = 0; i < size; i++) {
      const pixelIdx = i * 4;
      // RGB channels (no mean subtraction for SCRFD, just normalize to 0-1)
      tensorData[i] = data[pixelIdx] / 255; // R
      tensorData[size + i] = data[pixelIdx + 1] / 255; // G
      tensorData[2 * size + i] = data[pixelIdx + 2] / 255; // B
    }

    const tensor = onnxEngine.createTensor(tensorData, [1, 3, this.inputSize, this.inputSize]);

    return {
      tensor,
      scaleX: 1 / scale,
      scaleY: 1 / scale,
      padX,
      padY,
    };
  }

  /**
   * Postprocess model outputs
   */
  private postprocess(
    outputs: InferenceSession.ReturnType,
    scaleX: number,
    scaleY: number,
    padX: number,
    padY: number,
  ): ScrfdDetection[] {
    const detections: ScrfdDetection[] = [];

    // SCRFD outputs: score_8, score_16, score_32, bbox_8, bbox_16, bbox_32, kps_8, kps_16, kps_32
    // Or: scores, bboxes, keypoints (concatenated)
    const outputNames = Object.keys(outputs);

    // Handle different output formats
    if (outputNames.length === 1 || outputNames.includes('output')) {
      // Single concatenated output - parse accordingly
      return this.parseSimpleOutput(outputs, scaleX, scaleY, padX, padY);
    }

    // Multi-output format (one per stride)
    for (const stride of STRIDES) {
      const scoreKey = outputNames.find((n) => n.includes(`score_${stride}`) || n.includes(`${stride}`));
      const bboxKey = outputNames.find((n) => n.includes(`bbox_${stride}`));
      const kpsKey = outputNames.find((n) => n.includes(`kps_${stride}`));

      if (!scoreKey || !bboxKey) continue;

      const scores = outputs[scoreKey].data as Float32Array;
      const bboxes = outputs[bboxKey].data as Float32Array;
      const kps = kpsKey ? (outputs[kpsKey].data as Float32Array) : null;

      const fmapSize = this.inputSize / stride;

      for (let y = 0; y < fmapSize; y++) {
        for (let x = 0; x < fmapSize; x++) {
          for (let anchor = 0; anchor < 2; anchor++) {
            const idx = (y * fmapSize + x) * 2 + anchor;
            const score = scores[idx];

            if (score < this.scoreThreshold) continue;

            // Decode bbox
            const bboxIdx = idx * 4;
            const cx = (x + 0.5 + bboxes[bboxIdx]) * stride - padX;
            const cy = (y + 0.5 + bboxes[bboxIdx + 1]) * stride - padY;
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

    return detections;
  }

  /**
   * Parse simple output format
   */
  private parseSimpleOutput(
    outputs: InferenceSession.ReturnType,
    scaleX: number,
    scaleY: number,
    padX: number,
    padY: number,
  ): ScrfdDetection[] {
    const detections: ScrfdDetection[] = [];
    const outputName = Object.keys(outputs)[0];
    const output = outputs[outputName];
    const data = output.data as Float32Array;
    const dims = output.dims;

    // Assume output shape [1, N, 15] where 15 = 4 (bbox) + 1 (score) + 10 (5 landmarks * 2)
    if (dims.length === 3 && dims[2] === 15) {
      const numDetections = dims[1];
      for (let i = 0; i < numDetections; i++) {
        const offset = i * 15;
        const score = data[offset + 4];

        if (score < this.scoreThreshold) continue;

        const x1 = (data[offset] - padX) * scaleX;
        const y1 = (data[offset + 1] - padY) * scaleY;
        const x2 = (data[offset + 2] - padX) * scaleX;
        const y2 = (data[offset + 3] - padY) * scaleY;

        const landmarks: number[][] = [];
        for (let k = 0; k < 5; k++) {
          const lx = (data[offset + 5 + k * 2] - padX) * scaleX;
          const ly = (data[offset + 6 + k * 2] - padY) * scaleY;
          landmarks.push([lx, ly]);
        }

        detections.push({
          box: {
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
          },
          score,
          landmarks,
        });
      }
    }

    return detections;
  }

  /**
   * Non-Maximum Suppression
   */
  private nms(detections: ScrfdDetection[]): ScrfdDetection[] {
    if (detections.length === 0) return [];

    // Sort by score descending
    const sorted = [...detections].sort((a, b) => b.score - a.score);
    const kept: ScrfdDetection[] = [];

    while (sorted.length > 0) {
      const best = sorted.shift()!;
      kept.push(best);

      // Remove overlapping detections
      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = this.calculateIoU(best.box, sorted[i].box);
        if (iou > this.nmsThreshold) {
          sorted.splice(i, 1);
        }
      }
    }

    return kept;
  }

  /**
   * Calculate Intersection over Union
   */
  private calculateIoU(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number },
  ): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    if (x2 < x1 || y2 < y1) return 0;

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  /**
   * Warm up model
   */
  async warmup(): Promise<void> {
    if (!this.session) {
      throw new Error('SCRFD model not loaded');
    }

    const dummyCanvas = new OffscreenCanvas(640, 480);
    const ctx = dummyCanvas.getContext('2d')!;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 640, 480);

    await this.detect(dummyCanvas);
    console.log('[SCRFD] Model warmed up');
  }

  /**
   * Dispose and cleanup
   */
  async dispose(): Promise<void> {
    if (this.session) {
      await onnxEngine.unloadModel(this.modelName);
      this.session = null;
      this.loaded = false;
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    name: string;
    inputSize: number;
    scoreThreshold: number;
    loaded: boolean;
  } {
    return {
      name: this.modelName,
      inputSize: this.inputSize,
      scoreThreshold: this.scoreThreshold,
      loaded: this.loaded,
    };
  }

  /**
   * Update score threshold
   */
  setScoreThreshold(threshold: number): void {
    this.scoreThreshold = threshold;
  }
}

// Singleton instance
let defaultDetector: SCRFD | null = null;

export function getSCRFD(): SCRFD {
  if (!defaultDetector) {
    defaultDetector = new SCRFD();
  }
  return defaultDetector;
}

export async function disposeSCRFD(): Promise<void> {
  if (defaultDetector) {
    await defaultDetector.dispose();
    defaultDetector = null;
  }
}

// Type guard
export function isScrfdDetection(obj: unknown): obj is ScrfdDetection {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return typeof d.score === 'number' && typeof d.box === 'object' && Array.isArray(d.landmarks);
}
