'use client';

import { prepareArcFaceModels, setPreloadedPrimaryModelBuffer } from './arcface-model-manager.client';
import { setPreloadedMediaPipeModelBuffer } from './face-embedding.client';
import { FaceModelPreloader, type PreloaderProgress } from './face-model-preloader.client';

type PreloaderManagerStatus = 'idle' | 'loading' | 'ready' | 'error';

type PreloaderManagerState = {
  status: PreloaderManagerStatus;
  progress: PreloaderProgress | null;
  error: string | null;
};

type PreloaderManagerListener = (state: PreloaderManagerState) => void;

let preloader: FaceModelPreloader | null = null;
let hasStarted = false;
let cachedBuffers: Map<string, ArrayBuffer | null> | null = null;
let state: PreloaderManagerState = {
  status: 'idle',
  progress: null,
  error: null,
};
const listeners = new Set<PreloaderManagerListener>();

function getSnapshot(): PreloaderManagerState {
  return {
    status: state.status,
    progress: state.progress ? { ...state.progress, resources: { ...state.progress.resources } } : null,
    error: state.error,
  };
}

function notifyListeners(): void {
  const snapshot = getSnapshot();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch {
      /* ignore */
    }
  }
}

export function startFaceModelPreload(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
  state = { status: 'loading', progress: null, error: null };
  notifyListeners();

  preloader = new FaceModelPreloader();
  preloader.onProgress((progress) => {
    state = { status: 'loading', progress, error: null };
    notifyListeners();
  });

  preloader
    .preloadAll()
    .then((buffers) => {
      cachedBuffers = buffers;
      state = { status: 'ready', progress: null, error: null };
      notifyListeners();

      const arcfaceBuffer = buffers.get('arcface-onnx');
      if (arcfaceBuffer) {
        setPreloadedPrimaryModelBuffer(arcfaceBuffer);
      }

      const tfliteBuffer = buffers.get('blaze-face-tflite');
      if (tfliteBuffer) {
        setPreloadedMediaPipeModelBuffer(new Uint8Array(tfliteBuffer));
      }

      prepareArcFaceModels({ preloadFallback: true });
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Falha ao baixar modelos de reconhecimento facial.';
      state = { status: 'error', progress: null, error: message };
      notifyListeners();

      prepareArcFaceModels({ preloadFallback: true });
    })
    .finally(() => {
      preloader = null;
    });
}

export function getPreloaderState(): PreloaderManagerState {
  return getSnapshot();
}

export function subscribePreloaderState(listener: PreloaderManagerListener): () => void {
  listeners.add(listener);
  listener(getSnapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function getPreloadedBuffer(id: string): ArrayBuffer | null {
  return cachedBuffers?.get(id) ?? null;
}

export function resetFaceModelPreload(): void {
  if (preloader) {
    preloader.abort();
    preloader = null;
  }

  hasStarted = false;
  cachedBuffers = null;
  state = { status: 'idle', progress: null, error: null };
  notifyListeners();
}

export type { PreloaderManagerState, PreloaderManagerStatus };
