/**
 * ONNX Runtime Web Engine
 *
 * Singleton manager for ONNX Runtime sessions.
 * Handles model loading, session management, and inference execution.
 *
 * Features:
 * - Lazy loading with preload support
 * - WebGPU → WebGL → WASM fallback chain
 * - Session caching and reuse
 * - Memory management and cleanup
 */

import * as ort from 'onnxruntime-web';

export type ExecutionProvider = 'webgpu' | 'webgl' | 'wasm';

export interface OnnxEngineConfig {
  executionProvider?: ExecutionProvider;
  numThreads?: number;
  wasmPaths?: string;
  enableProfiling?: boolean;
}

interface ModelSession {
  session: ort.InferenceSession;
  modelPath: string;
  loadedAt: number;
}

const MODEL_BASE_PATH = '/models';
const DEFAULT_NUM_THREADS = 4;

class OnnxRuntimeEngine {
  private sessions: Map<string, ModelSession> = new Map();
  private executionProvider: ExecutionProvider = 'wasm';
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the ONNX Runtime environment
   * Must be called before any model loading
   */
  async initialize(config?: OnnxEngineConfig): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitialize(config);
    return this.initPromise;
  }

  private async _doInitialize(config?: OnnxEngineConfig): Promise<void> {
    try {
      // Configure WASM paths
      const wasmPaths = config?.wasmPaths || '/node_modules/onnxruntime-web/dist/';
      ort.env.wasm.wasmPaths = wasmPaths;
      ort.env.wasm.numThreads = config?.numThreads ?? DEFAULT_NUM_THREADS;

      // Try to detect best execution provider
      this.executionProvider = config?.executionProvider || (await this.detectBestProvider());

      if (config?.enableProfiling) {
        ort.env.logLevel = 'verbose';
      }

      this.initialized = true;
      console.log(`[OnnxEngine] Initialized with provider: ${this.executionProvider}`);
    } catch (error) {
      console.error('[OnnxEngine] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect the best available execution provider
   */
  private async detectBestProvider(): Promise<ExecutionProvider> {
    // Check WebGPU support
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        if (adapter) {
          console.log('[OnnxEngine] WebGPU available');
          return 'webgpu';
        }
      } catch {
        // WebGPU not available
      }
    }

    // Check WebGL support
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        console.log('[OnnxEngine] WebGL available');
        return 'webgl';
      }
    }

    // Fallback to WASM
    console.log('[OnnxEngine] Using WASM backend');
    return 'wasm';
  }

  /**
   * Load an ONNX model and create an inference session
   */
  async loadModel(
    modelName: string,
    options?: {
      modelPath?: string;
      forceReload?: boolean;
    },
  ): Promise<ort.InferenceSession> {
    if (!this.initialized) {
      await this.initialize();
    }

    const cacheKey = modelName;

    // Return cached session if available
    if (!options?.forceReload && this.sessions.has(cacheKey)) {
      return this.sessions.get(cacheKey)!.session;
    }

    const modelPath = options?.modelPath || `${MODEL_BASE_PATH}/${modelName}`;

    try {
      console.log(`[OnnxEngine] Loading model: ${modelPath}`);
      const startTime = performance.now();

      // Create session options based on provider
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: this.getExecutionProviders(),
        graphOptimizationLevel: 'all',
      };

      // Load model
      const session = await ort.InferenceSession.create(modelPath, sessionOptions);

      const loadTime = performance.now() - startTime;
      console.log(`[OnnxEngine] Model loaded in ${loadTime.toFixed(0)}ms: ${modelName}`);

      // Cache the session
      this.sessions.set(cacheKey, {
        session,
        modelPath,
        loadedAt: Date.now(),
      });

      return session;
    } catch (error) {
      console.error(`[OnnxEngine] Failed to load model: ${modelName}`, error);
      throw error;
    }
  }

  /**
   * Get execution providers in fallback order
   */
  private getExecutionProviders(): ort.InferenceSession.ExecutionProviderConfig[] {
    switch (this.executionProvider) {
      case 'webgpu':
        return ['webgpu', 'webgl', 'wasm'];
      case 'webgl':
        return ['webgl', 'wasm'];
      default:
        return ['wasm'];
    }
  }

  /**
   * Run inference on a loaded model
   */
  async runInference(
    modelName: string,
    feeds: ort.InferenceSession.FeedsType,
    options?: ort.InferenceSession.RunOptions,
  ): Promise<ort.InferenceSession.ReturnType> {
    const session = this.sessions.get(modelName)?.session;

    if (!session) {
      throw new Error(`Model not loaded: ${modelName}. Call loadModel() first.`);
    }

    return session.run(feeds, options);
  }

  /**
   * Create a tensor from various input types
   */
  createTensor(
    data: Float32Array | number[],
    dims: readonly number[],
    type: 'float32' | 'int32' | 'uint8' = 'float32',
  ): ort.Tensor {
    const typedData = data instanceof Float32Array ? data : new Float32Array(data);
    return new ort.Tensor(type, typedData, dims);
  }

  /**
   * Unload a specific model
   */
  async unloadModel(modelName: string): Promise<void> {
    const cached = this.sessions.get(modelName);
    if (cached) {
      try {
        await cached.session.release();
      } catch {
        // Ignore release errors
      }
      this.sessions.delete(modelName);
    }
  }

  /**
   * Unload all models and cleanup
   */
  async dispose(): Promise<void> {
    for (const [name, cached] of this.sessions) {
      try {
        await cached.session.release();
      } catch {
        // Ignore release errors
      }
      this.sessions.delete(name);
    }

    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Get info about loaded models
   */
  getLoadedModels(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get current execution provider
   */
  getExecutionProvider(): ExecutionProvider {
    return this.executionProvider;
  }

  /**
   * Check if engine is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const onnxEngine = new OnnxRuntimeEngine();

// Export class for testing
export { OnnxRuntimeEngine };
