/**
 * ArcFace Embedding Extractor
 *
 * Uses InsightFace ArcFace model (w600k_r50.onnx or w600k_mbf.onnx)
 * to extract 512-dimensional face embeddings from aligned face images.
 *
 * Features:
 * - ONNX Runtime inference
 * - L2 normalization
 * - Quality-based embedding filtering
 */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

import { alignFace, calculateFaceQuality,preprocessForArcFace } from './face-alignment';
import { onnxEngine } from './onnx-runtime';

export interface ArcFaceConfig {
  modelPath?: string;
  modelName?: string;
  inputSize?: number;
}

export interface EmbeddingResult {
  embedding: Float32Array;
  normalized: boolean;
  quality: number;
  extractionTimeMs: number;
}

const DEFAULT_MODEL_NAME = 'w600k_r50.onnx';
const EMBEDDING_DIM = 512;
const INPUT_SIZE = 112;

export class ArcFaceEmbedder {
  private modelName: string;
  private inputSize: number;
  private session: InferenceSession | null = null;
  private loaded = false;

  constructor(config?: ArcFaceConfig) {
    this.modelName = config?.modelName || DEFAULT_MODEL_NAME;
    this.inputSize = config?.inputSize || INPUT_SIZE;
  }

  /**
   * Load the ArcFace model
   */
  async load(modelPath?: string): Promise<void> {
    if (this.loaded) return;

    try {
      const path = modelPath || `/models/${this.modelName}`;
      this.session = await onnxEngine.loadModel(this.modelName, { modelPath: path });
      this.loaded = true;
      console.log(`[ArcFace] Model loaded: ${this.modelName}`);
    } catch (error) {
      console.error('[ArcFace] Failed to load model:', error);
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
   * Extract embedding from aligned face image
   * Expects 112x112 RGB image canvas
   */
  async extractEmbedding(alignedFace: OffscreenCanvas | HTMLCanvasElement): Promise<EmbeddingResult> {
    if (!this.session) {
      throw new Error('ArcFace model not loaded. Call load() first.');
    }

    const startTime = performance.now();

    // Preprocess image to tensor
    const inputTensor = preprocessForArcFace(alignedFace);

    // Create ONNX tensor (1, 3, 112, 112)
    const tensor = onnxEngine.createTensor(inputTensor, [1, 3, this.inputSize, this.inputSize]);

    // Run inference
    const inputName = this.session.inputNames[0];
    const feeds: Record<string, Tensor> = { [inputName]: tensor };
    const results = await this.session.run(feeds);

    // Get output embedding
    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    const embedding = new Float32Array(outputTensor.data as Float32Array);

    // L2 normalize
    const normalized = this.normalizeL2(embedding);

    const extractionTimeMs = performance.now() - startTime;

    return {
      embedding: normalized,
      normalized: true,
      quality: 1.0, // Will be set by caller based on detection quality
      extractionTimeMs,
    };
  }

  /**
   * Extract embedding from full image with detected face landmarks
   * Handles alignment internally
   */
  async extractFromDetection(
    sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
    landmarks: number[][],
  ): Promise<EmbeddingResult> {
    if (!this.session) {
      throw new Error('ArcFace model not loaded. Call load() first.');
    }

    const startTime = performance.now();

    // Align face using landmarks
    const alignedFace = alignFace(sourceCanvas, landmarks, this.inputSize);

    // Calculate face quality from landmarks
    const quality = calculateFaceQuality(landmarks);

    // Preprocess and run inference
    const inputTensor = preprocessForArcFace(alignedFace);
    const tensor = onnxEngine.createTensor(inputTensor, [1, 3, this.inputSize, this.inputSize]);

    const inputName = this.session.inputNames[0];
    const feeds: Record<string, Tensor> = { [inputName]: tensor };
    const results = await this.session.run(feeds);

    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    const embedding = new Float32Array(outputTensor.data as Float32Array);

    // L2 normalize
    const normalized = this.normalizeL2(embedding);

    const extractionTimeMs = performance.now() - startTime;

    return {
      embedding: normalized,
      normalized: true,
      quality,
      extractionTimeMs,
    };
  }

  /**
   * L2 normalize embedding vector
   */
  private normalizeL2(embedding: Float32Array): Float32Array {
    let norm = 0;
    for (let i = 0; i < embedding.length; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);

    const normalized = new Float32Array(embedding.length);
    for (let i = 0; i < embedding.length; i++) {
      normalized[i] = embedding[i] / norm;
    }

    return normalized;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: Float32Array | number[], embedding2: Float32Array | number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    // If both embeddings are already normalized, dot product is the similarity
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  /**
   * Calculate Euclidean distance between two embeddings
   */
  static euclideanDistance(embedding1: Float32Array | number[], embedding2: Float32Array | number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Average multiple embeddings and normalize
   * Useful for creating enrollment templates from multiple captures
   */
  static averageEmbeddings(embeddings: Float32Array[]): Float32Array {
    if (embeddings.length === 0) {
      throw new Error('No embeddings to average');
    }

    const dim = embeddings[0].length;
    const result = new Float32Array(dim);

    // Sum all embeddings
    for (const emb of embeddings) {
      if (emb.length !== dim) {
        throw new Error('All embeddings must have the same dimension');
      }
      for (let i = 0; i < dim; i++) {
        result[i] += emb[i];
      }
    }

    // Average
    for (let i = 0; i < dim; i++) {
      result[i] /= embeddings.length;
    }

    // L2 normalize the averaged embedding
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += result[i] * result[i];
    }
    norm = Math.sqrt(norm);

    for (let i = 0; i < dim; i++) {
      result[i] /= norm;
    }

    return result;
  }

  /**
   * Warm up the model
   */
  async warmup(): Promise<void> {
    if (!this.session) {
      throw new Error('ArcFace model not loaded');
    }

    // Create dummy input and run inference
    const dummyInput = new Float32Array(3 * this.inputSize * this.inputSize);
    const tensor = onnxEngine.createTensor(dummyInput, [1, 3, this.inputSize, this.inputSize]);

    const inputName = this.session.inputNames[0];
    await this.session.run({ [inputName]: tensor });

    console.log('[ArcFace] Model warmed up');
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
  getModelInfo(): { name: string; inputSize: number; embeddingDim: number; loaded: boolean } {
    return {
      name: this.modelName,
      inputSize: this.inputSize,
      embeddingDim: EMBEDDING_DIM,
      loaded: this.loaded,
    };
  }
}

// Export singleton for convenience
let defaultEmbedder: ArcFaceEmbedder | null = null;

export function getArcFaceEmbedder(): ArcFaceEmbedder {
  if (!defaultEmbedder) {
    defaultEmbedder = new ArcFaceEmbedder();
  }
  return defaultEmbedder;
}

export async function disposeArcFaceEmbedder(): Promise<void> {
  if (defaultEmbedder) {
    await defaultEmbedder.dispose();
    defaultEmbedder = null;
  }
}
