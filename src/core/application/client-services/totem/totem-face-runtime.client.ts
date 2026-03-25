/**
 * Totem Face Runtime Client
 *
 * Client interface for the face recognition Web Worker.
 * Handles communication, timeouts, and error recovery.
 */

export interface TotemFaceWorkerInitPayload {
  maxFaces: number;
  minFaceSize: number;
  livenessEnabled: boolean;
  livenessThreshold: number;
  confidenceThreshold: number;
  modelsPath?: string;
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceQualityMetadata {
  brightness: number;
  blurriness: number;
  faceSize: number;
  headPoseYaw: number;
  headPosePitch: number;
  headPoseRoll: number;
  landmarkConfidence: number;
}

export interface TotemFaceAnalysis {
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

type WorkerRequest =
  | { id: number; type: 'init'; payload: TotemFaceWorkerInitPayload }
  | { id: number; type: 'analyze'; payload: { bitmap: ImageBitmap } }
  | { id: number; type: 'dispose' };

type WorkerResponse = {
  id: number;
  ok: boolean;
  error?: string;
  data?: unknown;
};

const DEFAULT_TIMEOUT_MS = 10000; // 10s for init (model loading)
const ANALYZE_TIMEOUT_MS = 5000; // 5s for analysis

export class TotemFaceRuntime {
  private worker: Worker | null = null;
  private sequence = 0;
  private initialized = false;
  private readonly pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: number;
    }
  >();

  /**
   * Initialize the worker with face recognition models
   */
  async init(payload: TotemFaceWorkerInitPayload): Promise<void> {
    if (this.initialized) {
      console.log('[FaceRuntime] Already initialized');
      return;
    }

    await this.call('init', payload, [], DEFAULT_TIMEOUT_MS);
    this.initialized = true;
    console.log('[FaceRuntime] Initialized successfully');
  }

  /**
   * Analyze a frame for face detection and embedding extraction
   */
  async analyze(bitmap: ImageBitmap): Promise<TotemFaceAnalysis> {
    if (!this.initialized) {
      throw new Error('Face runtime not initialized. Call init() first.');
    }

    return this.call('analyze', { bitmap }, [bitmap], ANALYZE_TIMEOUT_MS) as Promise<TotemFaceAnalysis>;
  }

  /**
   * Check if runtime is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Dispose worker and cleanup resources
   */
  async dispose(): Promise<void> {
    try {
      if (this.worker) {
        await this.call('dispose', undefined, [], 2000);
      }
    } catch {
      // Ignore errors during dispose
    }

    // Clear all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker disposed'));
      this.pending.delete(id);
    }

    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;

    console.log('[FaceRuntime] Disposed');
  }

  private ensureWorker(): void {
    if (this.worker) {
      return;
    }

    this.worker = new Worker(new URL('../../../../workers/totem-face.worker.ts', import.meta.url), {
      type: 'module',
      name: 'totem-face-worker',
    });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);

      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(response.id);

      if (!response.ok) {
        pending.reject(new Error(response.error ?? 'Face worker request failed.'));
        return;
      }

      pending.resolve(response.data);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      console.error('[FaceRuntime] Worker error:', event.message);

      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(event.message || 'Face worker runtime error.'));
        this.pending.delete(id);
      }

      // Reset state on error
      this.initialized = false;
    };
  }

  private call(
    type: 'dispose',
    payload?: undefined,
    transferList?: Transferable[],
    timeoutMs?: number,
  ): Promise<unknown>;
  private call(
    type: 'init',
    payload: TotemFaceWorkerInitPayload,
    transferList?: Transferable[],
    timeoutMs?: number,
  ): Promise<unknown>;
  private call(
    type: 'analyze',
    payload: { bitmap: ImageBitmap },
    transferList?: Transferable[],
    timeoutMs?: number,
  ): Promise<unknown>;
  private call(
    type: WorkerRequest['type'],
    payload?: unknown,
    transferList: Transferable[] = [],
    timeoutMs: number = 5000,
  ): Promise<unknown> {
    this.ensureWorker();

    const id = ++this.sequence;
    const request = { id, type, ...(payload ? { payload } : {}) } as unknown as WorkerRequest;

    return new Promise<unknown>((resolve, reject) => {
      // Setup timeout
      const timeout = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Face worker request timed out (${type})`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeout });
      this.worker!.postMessage(request, transferList);
    });
  }
}

/**
 * Create a singleton instance
 */
let defaultRuntime: TotemFaceRuntime | null = null;

export function getTotemFaceRuntime(): TotemFaceRuntime {
  if (!defaultRuntime) {
    defaultRuntime = new TotemFaceRuntime();
  }
  return defaultRuntime;
}

export async function disposeTotemFaceRuntime(): Promise<void> {
  if (defaultRuntime) {
    await defaultRuntime.dispose();
    defaultRuntime = null;
  }
}
