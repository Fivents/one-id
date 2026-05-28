'use client';

type PreloadResource = {
  id: string;
  url: string;
  priority: number;
  size: number;
  type: 'wasm' | 'mjs' | 'model-onnx' | 'model-tflite' | 'js-bundle';
  fetchOptions?: RequestInit;
};

type ResourceStatus = 'pending' | 'downloading' | 'cached' | 'ready' | 'error';
type PreloaderPhase = 'loading-runtime' | 'loading-models' | 'initializing' | 'ready';

type ResourceProgress = {
  status: ResourceStatus;
  percent: number;
  bytes: number;
  totalBytes: number;
  error?: string;
};

type PreloaderProgress = {
  overallPercent: number;
  totalBytes: number;
  downloadedBytes: number;
  resources: Record<string, ResourceProgress>;
  currentPhase: PreloaderPhase;
};

type ProgressCallback = (progress: PreloaderProgress) => void;

const ARCFACE_CACHE_NAME = 'one-id-arcface-model-cache';
const PRELOADER_CACHE_NAME = 'one-id-face-preloader-cache';

function detectMaxConcurrency(): number {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 4;
  }
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  switch (conn?.effectiveType) {
    case 'slow-2g':
      return 2;
    case '2g':
      return 2;
    case '3g':
      return 4;
    case '4g':
      return 6;
    default:
      return 4;
  }
}

const DEFAULT_PRELOAD_RESOURCES: PreloadResource[] = [
  { id: 'ort-wasm-simd-mjs', url: '/wasm/ort-wasm-simd-threaded.mjs', priority: 0, size: 39_936, type: 'mjs' },
  { id: 'onnxruntime-web', url: '', priority: 1, size: 512_000, type: 'js-bundle' },
  { id: 'mediapipe-tasks-vision', url: '', priority: 3, size: 819_200, type: 'js-bundle' },
  { id: 'ort-wasm-simd', url: '/wasm/ort-wasm-simd-threaded.wasm', priority: 100, size: 11_534_336, type: 'wasm' },
  {
    id: 'blaze-face-tflite',
    url:
      process.env.NEXT_PUBLIC_MEDIAPIPE_FACE_DETECTOR_MODEL_PATH ?? '/models/mediapipe/blaze_face_short_range.tflite',
    priority: 102,
    size: 229_376,
    type: 'model-tflite',
  },
  {
    id: 'arcface-onnx',
    url: process.env.NEXT_PUBLIC_ARCFACE_ONNX_REMOTE_URL ?? '/models/arcface/onnx/arcfaceresnet100-11-int8.onnx',
    priority: 200,
    size: 66_060_288,
    type: 'model-onnx',
  },
];

export class FaceModelPreloader {
  private buffers = new Map<string, ArrayBuffer | null>();
  private resourceProgress = new Map<string, ResourceProgress>();
  private progressListeners = new Set<ProgressCallback>();
  private phase: PreloaderPhase = 'loading-runtime';
  private aborted = false;
  private maxConcurrency: number;
  private totalBytes: number;
  private downloadedBytes = 0;

  constructor(resources?: PreloadResource[]) {
    this.maxConcurrency = detectMaxConcurrency();
    const resolved = resources ?? DEFAULT_PRELOAD_RESOURCES;
    this.totalBytes = resolved.reduce((sum, r) => sum + r.size, 0);

    for (const r of resolved) {
      this.resourceProgress.set(r.id, {
        status: 'pending',
        percent: 0,
        bytes: 0,
        totalBytes: r.size,
      });
    }
  }

  onProgress(cb: ProgressCallback): () => void {
    this.progressListeners.add(cb);
    return () => this.progressListeners.delete(cb);
  }

  async preloadAll(resources?: PreloadResource[]): Promise<Map<string, ArrayBuffer | null>> {
    const list = resources ?? DEFAULT_PRELOAD_RESOURCES;
    this.phase = 'loading-runtime';
    this.emitProgress();

    const sorted = [...list].sort((a, b) => a.priority - b.priority);
    const tiers = groupByPriorityTiers(sorted);

    for (const tier of tiers) {
      if (this.aborted) break;
      await this.downloadTier(tier);
    }

    if (!this.aborted) {
      this.phase = 'ready';
      this.emitProgress();
    }

    return this.buffers;
  }

  getBuffer(id: string): ArrayBuffer | null | undefined {
    return this.buffers.get(id);
  }

  getPhase(): PreloaderPhase {
    return this.phase;
  }

  abort(): void {
    this.aborted = true;
  }

  private async downloadTier(resources: PreloadResource[]): Promise<void> {
    const queue = [...resources];
    const active = new Set<Promise<void>>();
    let idx = 0;

    const startNext = () => {
      while (!this.aborted && active.size < this.maxConcurrency && idx < queue.length) {
        const resource = queue[idx++];
        const promise = this.preloadResource(resource).finally(() => {
          active.delete(promise);
          startNext();
        });
        active.add(promise);
      }
    };

    startNext();
    await Promise.allSettled(active);
  }

  private async preloadResource(resource: PreloadResource): Promise<void> {
    this.updateStatus(resource.id, { status: 'downloading' });

    try {
      if (resource.type === 'js-bundle') {
        await this.importBundle(resource.id);
        this.bytesAdded(resource.id, resource.size);
        this.updateStatus(resource.id, { status: 'ready', percent: 100, bytes: resource.size });
        return;
      }

      const cached = await this.readCache(resource.id, resource.url);
      if (cached) {
        this.buffers.set(resource.id, cached);
        this.bytesAdded(resource.id, cached.byteLength);
        this.updateStatus(resource.id, { status: 'cached', percent: 100, bytes: cached.byteLength });
        return;
      }

      const buffer = await this.downloadStream(resource);
      this.buffers.set(resource.id, buffer);
      void this.writeCache(resource.id, resource.url, buffer);
      this.bytesAdded(resource.id, buffer.byteLength);
      this.updateStatus(resource.id, { status: 'ready', percent: 100, bytes: buffer.byteLength });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Download failed';
      this.updateStatus(resource.id, { status: 'error', error: msg });
      console.error(`[FaceModelPreloader] Error preloading ${resource.id}:`, error);
    } finally {
      this.emitProgress();
    }
  }

  private async importBundle(id: string): Promise<void> {
    switch (id) {
      case 'onnxruntime-web':
        await import('onnxruntime-web');
        this.phase = 'loading-models';
        this.emitProgress();
        break;
      case 'mediapipe-tasks-vision':
        await import('@mediapipe/tasks-vision');
        break;
    }
  }

  private async downloadStream(resource: PreloadResource): Promise<ArrayBuffer> {
    const response = await fetch(resource.url, {
      method: 'GET',
      cache: 'force-cache',
      headers: { Accept: 'application/octet-stream' },
      ...resource.fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${resource.id} (HTTP ${response.status})`);
    }

    if (!response.body) {
      const buffer = await response.arrayBuffer();
      this.updateStatus(resource.id, { bytes: buffer.byteLength });
      return buffer;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloaded = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        downloaded += value.byteLength;
        const pct = Math.min(Math.round((downloaded / resource.size) * 100), 99);
        this.updateStatus(resource.id, { percent: pct, bytes: downloaded });
        this.emitProgress();
      }
    }

    const merged = new Uint8Array(downloaded);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }

    return merged.buffer;
  }

  private bytesAdded(id: string, count: number): void {
    this.downloadedBytes += count;
    this.updateStatus(id, { bytes: count });
  }

  private async readCache(id: string, url: string): Promise<ArrayBuffer | null> {
    try {
      const cache = await caches.open(id === 'arcface-onnx' ? ARCFACE_CACHE_NAME : PRELOADER_CACHE_NAME);
      const match = await cache.match(url);
      if (!match) return null;
      const buf = await match.arrayBuffer();
      return buf.byteLength === 0 ? null : buf;
    } catch {
      return null;
    }
  }

  private async writeCache(id: string, url: string, buffer: ArrayBuffer): Promise<void> {
    try {
      const cache = await caches.open(id === 'arcface-onnx' ? ARCFACE_CACHE_NAME : PRELOADER_CACHE_NAME);
      await cache.put(
        url,
        new Response(buffer.slice(0), {
          headers: { 'Content-Type': 'application/octet-stream' },
        }),
      );
    } catch {
      // best-effort
    }
  }

  private updateStatus(id: string, patch: Partial<ResourceProgress> & { status?: ResourceStatus }): void {
    const current = this.resourceProgress.get(id);
    if (current) Object.assign(current, patch);
  }

  private emitProgress(): void {
    const p = this.computeProgress();
    for (const cb of this.progressListeners) {
      try {
        cb(p);
      } catch {
        /* ignore */
      }
    }
  }

  private computeProgress(): PreloaderProgress {
    let total = 0;
    let downloaded = 0;

    for (const res of this.resourceProgress.values()) {
      total += res.totalBytes;
      downloaded += res.bytes;
    }

    const resources: Record<string, ResourceProgress> = {};
    for (const [id, rp] of this.resourceProgress) {
      resources[id] = { ...rp };
    }

    return {
      overallPercent: total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0,
      totalBytes: total,
      downloadedBytes: downloaded,
      resources,
      currentPhase: this.phase,
    };
  }
}

function groupByPriorityTiers(sorted: PreloadResource[]): PreloadResource[][] {
  const tiers: PreloadResource[][] = [];
  let current: PreloadResource[] = [];
  let lastTier = -1;

  for (const r of sorted) {
    const t = Math.floor(r.priority / 100);
    if (t !== lastTier && current.length > 0) {
      tiers.push(current);
      current = [];
    }
    lastTier = t;
    current.push(r);
  }
  if (current.length > 0) tiers.push(current);

  return tiers;
}

export type { PreloaderPhase, PreloaderProgress, PreloadResource, ResourceProgress };
