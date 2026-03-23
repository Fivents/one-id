export interface TotemFaceWorkerInitPayload {
  maxFaces: number;
  minFaceSize: number;
  livenessEnabled: boolean;
  // NEW (Phase 4): Detector and tracking configuration
  trackingEnabled?: boolean;
  detectorType?: 'human' | 'scrfd';
  fallbackEnabled?: boolean;
}

export interface TotemFaceAnalysis {
  faceCount: number;
  blinkDetected: boolean;
  liveness?: {
    antiSpoofScore: number;
    blinkDetected: boolean;
    headMovementDetected: boolean;
    textureQuality: number;
    finalLivenessScore: number;
  };
  face: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    isBigEnough: boolean;
    embedding: number[];
    livenessScore: number;
    qualityScore?: number; // NEW (Phase 1)
    qualityMetadata?: {
      brightness: number;
      blurriness: number;
      faceSize: number;
      headPoseYaw: number;
      headPosePitch: number;
      headPoseRoll: number;
      landmarkConfidence: number;
    }; // NEW (Phase 1)
    // NEW (Phase 4): Face tracking fields
    trackId?: string;
    trackStability?: number;
    historicalLivenessAvg?: number;
  } | null;
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

export class TotemFaceRuntime {
  private worker: Worker | null = null;
  private sequence = 0;
  private readonly pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  init(payload: TotemFaceWorkerInitPayload): Promise<void> {
    return this.call('init', payload).then(() => undefined);
  }

  analyze(bitmap: ImageBitmap): Promise<TotemFaceAnalysis> {
    return this.call('analyze', { bitmap }, [bitmap]) as Promise<TotemFaceAnalysis>;
  }

  async dispose(): Promise<void> {
    try {
      await this.call('dispose');
    } catch {
      // no-op
    }

    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  private ensureWorker() {
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

      this.pending.delete(response.id);

      if (!response.ok) {
        pending.reject(new Error(response.error ?? 'Face worker request failed.'));
        return;
      }

      pending.resolve(response.data);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error(event.message || 'Face worker runtime error.'));
      }

      this.pending.clear();
    };
  }

  private call(type: 'dispose'): Promise<unknown>;
  private call(type: 'init', payload: TotemFaceWorkerInitPayload): Promise<unknown>;
  private call(type: 'analyze', payload: { bitmap: ImageBitmap }, transferList?: Transferable[]): Promise<unknown>;
  private call(type: WorkerRequest['type'], payload?: unknown, transferList: Transferable[] = []): Promise<unknown> {
    this.ensureWorker();

    const id = ++this.sequence;

    const request = { id, type, ...(payload ? { payload } : {}) } as unknown as WorkerRequest;

    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.worker!.postMessage(request, transferList);

    return promise;
  }
}
