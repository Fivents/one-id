import * as ort from 'onnxruntime-web';

const DEFAULT_PRIMARY_REMOTE_MODEL_URL = '/models/arcface/onnx/arcfaceresnet100-11-int8.onnx';
const DEFAULT_FALLBACK_MODEL_PATH = '/models/arcface/onnx/arcfaceresnet100-11-int8.onnx';
const DEFAULT_PRIMARY_REMOTE_TIMEOUT_MS = 25_000;
const PRIMARY_MODEL_CACHE_NAME = 'one-id-arcface-model-cache';
const PRIMARY_MODEL_CACHE_KEY = process.env.NEXT_PUBLIC_ARCFACE_ONNX_CACHE_KEY?.trim() || 'arcface-primary-v1';

const LEGACY_PRIMARY_MODEL_PATH = process.env.NEXT_PUBLIC_ARCFACE_ONNX_PATH?.trim();
const PRIMARY_REMOTE_MODEL_URL =
  process.env.NEXT_PUBLIC_ARCFACE_ONNX_REMOTE_URL?.trim() ||
  (LEGACY_PRIMARY_MODEL_PATH && /^https?:\/\//i.test(LEGACY_PRIMARY_MODEL_PATH)
    ? LEGACY_PRIMARY_MODEL_PATH
    : DEFAULT_PRIMARY_REMOTE_MODEL_URL);
const FALLBACK_MODEL_PATH = process.env.NEXT_PUBLIC_ARCFACE_FALLBACK_ONNX_PATH?.trim() || DEFAULT_FALLBACK_MODEL_PATH;
const parsedPrimaryRemoteTimeout = Number.parseInt(process.env.NEXT_PUBLIC_ARCFACE_ONNX_REMOTE_TIMEOUT_MS ?? '', 10);
const PRIMARY_REMOTE_TIMEOUT_MS =
  Number.isFinite(parsedPrimaryRemoteTimeout) && parsedPrimaryRemoteTimeout > 0
    ? parsedPrimaryRemoteTimeout
    : DEFAULT_PRIMARY_REMOTE_TIMEOUT_MS;

type ArcFaceModelStatus = 'idle' | 'downloading' | 'ready' | 'error';
type ArcFaceFallbackStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ArcFaceModelVariant = 'primary' | 'fallback';

export type ArcFaceModelRuntimeState = {
  primary: {
    status: ArcFaceModelStatus;
    progressPercent: number;
    downloadedBytes: number;
    totalBytes: number | null;
    source: 'cache' | 'remote' | null;
    errorMessage: string | null;
  };
  fallback: {
    status: ArcFaceFallbackStatus;
    errorMessage: string | null;
  };
  preferredVariant: ArcFaceModelVariant;
  activeVariant: ArcFaceModelVariant;
};

type ArcFaceModelStateListener = (state: ArcFaceModelRuntimeState) => void;

const ARC_FACE_SESSION_OPTIONS: ort.InferenceSession.SessionOptions = {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
};

let primaryModelBuffer: ArrayBuffer | null = null;
let primaryModelDownloadPromise: Promise<ArrayBuffer> | null = null;
let primarySessionPromise: Promise<ort.InferenceSession> | null = null;
let fallbackSessionPromise: Promise<ort.InferenceSession> | null = null;

let runtimeConfigured = false;

let state: ArcFaceModelRuntimeState = {
  primary: {
    status: 'idle',
    progressPercent: 0,
    downloadedBytes: 0,
    totalBytes: null,
    source: null,
    errorMessage: null,
  },
  fallback: {
    status: 'idle',
    errorMessage: null,
  },
  preferredVariant: 'primary',
  activeVariant: 'primary',
};

const listeners = new Set<ArcFaceModelStateListener>();

function getPrimaryCacheRequestUrl(): string {
  return `https://one-id.local/arcface/${PRIMARY_MODEL_CACHE_KEY}.onnx`;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function configureRuntime() {
  if (runtimeConfigured) {
    return;
  }

  ort.env.wasm.wasmPaths = '/wasm/';
  ort.env.wasm.proxy = false;
  ort.env.wasm.simd = true;

  runtimeConfigured = true;
}

function setState(producer: (current: ArcFaceModelRuntimeState) => ArcFaceModelRuntimeState) {
  state = producer(state);
  const snapshot = getArcFaceModelState();

  listeners.forEach((listener) => {
    listener(snapshot);
  });
}

function getStateSnapshot(): ArcFaceModelRuntimeState {
  return {
    primary: { ...state.primary },
    fallback: { ...state.fallback },
    preferredVariant: state.preferredVariant,
    activeVariant: state.activeVariant,
  };
}

function hasBrowserCacheStorage(): boolean {
  return typeof window !== 'undefined' && typeof caches !== 'undefined';
}

async function readPrimaryModelFromCache(): Promise<ArrayBuffer | null> {
  if (!hasBrowserCacheStorage()) {
    return null;
  }

  try {
    const cache = await caches.open(PRIMARY_MODEL_CACHE_NAME);
    const response = await cache.match(getPrimaryCacheRequestUrl());

    if (!response) {
      return null;
    }

    const modelBuffer = await response.arrayBuffer();
    if (modelBuffer.byteLength === 0) {
      await cache.delete(getPrimaryCacheRequestUrl());
      return null;
    }

    return modelBuffer;
  } catch {
    return null;
  }
}

async function persistPrimaryModelInCache(modelBuffer: ArrayBuffer): Promise<void> {
  if (!hasBrowserCacheStorage()) {
    return;
  }

  try {
    const cache = await caches.open(PRIMARY_MODEL_CACHE_NAME);
    await cache.put(
      getPrimaryCacheRequestUrl(),
      new Response(modelBuffer.slice(0), {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }),
    );
  } catch {
    // Cache persistence is best-effort and should never block recognition.
  }
}

async function clearPrimaryModelCache(): Promise<void> {
  if (!hasBrowserCacheStorage()) {
    return;
  }

  try {
    const cache = await caches.open(PRIMARY_MODEL_CACHE_NAME);
    await cache.delete(getPrimaryCacheRequestUrl());
  } catch {
    // Intentionally ignored.
  }
}

async function downloadPrimaryModelFromRemote(): Promise<ArrayBuffer> {
  setState((current) => ({
    ...current,
    primary: {
      ...current.primary,
      status: 'downloading',
      source: 'remote',
      downloadedBytes: 0,
      totalBytes: null,
      progressPercent: 0,
      errorMessage: null,
    },
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, PRIMARY_REMOTE_TIMEOUT_MS);

  try {
    const response = await fetch(PRIMARY_REMOTE_MODEL_URL, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/octet-stream',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to download primary ArcFace model (status ${response.status}).`);
    }

    const totalHeader = response.headers.get('content-length');
    const totalBytesParsed = Number.parseInt(totalHeader ?? '', 10);
    const totalBytes = Number.isFinite(totalBytesParsed) && totalBytesParsed > 0 ? totalBytesParsed : null;

    setState((current) => ({
      ...current,
      primary: {
        ...current.primary,
        status: 'downloading',
        totalBytes,
        source: 'remote',
        downloadedBytes: 0,
        progressPercent: 0,
        errorMessage: null,
      },
    }));

    if (!response.body) {
      const buffer = await response.arrayBuffer();

      setState((current) => ({
        ...current,
        primary: {
          ...current.primary,
          status: 'ready',
          source: 'remote',
          downloadedBytes: buffer.byteLength,
          totalBytes: buffer.byteLength,
          progressPercent: 100,
        },
      }));

      return buffer;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      chunks.push(value);
      downloadedBytes += value.byteLength;

      setState((current) => ({
        ...current,
        primary: {
          ...current.primary,
          status: 'downloading',
          source: 'remote',
          downloadedBytes,
          totalBytes,
          progressPercent: totalBytes ? Math.max(1, Math.min(99, Math.round((downloadedBytes / totalBytes) * 100))) : 0,
        },
      }));
    }

    const completeBuffer = new Uint8Array(downloadedBytes);
    let offset = 0;

    chunks.forEach((chunk) => {
      completeBuffer.set(chunk, offset);
      offset += chunk.byteLength;
    });

    const modelBuffer = completeBuffer.buffer;

    setState((current) => ({
      ...current,
      primary: {
        ...current.primary,
        status: 'ready',
        source: 'remote',
        downloadedBytes,
        totalBytes: totalBytes ?? downloadedBytes,
        progressPercent: 100,
        errorMessage: null,
      },
    }));

    return modelBuffer;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `Primary ArcFace model download timed out after ${Math.ceil(PRIMARY_REMOTE_TIMEOUT_MS / 1000)}s.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function ensurePrimaryModelBuffer(options?: { forceRemoteDownload?: boolean }): Promise<ArrayBuffer> {
  if (primaryModelBuffer && !options?.forceRemoteDownload) {
    return primaryModelBuffer;
  }

  if (primaryModelDownloadPromise && !options?.forceRemoteDownload) {
    return primaryModelDownloadPromise;
  }

  primaryModelDownloadPromise = (async () => {
    if (!options?.forceRemoteDownload) {
      const cachedBuffer = await readPrimaryModelFromCache();
      if (cachedBuffer) {
        primaryModelBuffer = cachedBuffer;

        setState((current) => ({
          ...current,
          primary: {
            ...current.primary,
            status: 'ready',
            source: 'cache',
            downloadedBytes: cachedBuffer.byteLength,
            totalBytes: cachedBuffer.byteLength,
            progressPercent: 100,
            errorMessage: null,
          },
        }));

        return cachedBuffer;
      }
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const downloadedBuffer = await downloadPrimaryModelFromRemote();
        primaryModelBuffer = downloadedBuffer;
        await persistPrimaryModelInCache(downloadedBuffer);
        return downloadedBuffer;
      } catch (error) {
        lastError = error;
      }
    }

    const errorMessage = getErrorMessage(lastError, 'Failed to download primary ArcFace model.');

    setState((current) => ({
      ...current,
      primary: {
        ...current.primary,
        status: 'error',
        source: null,
        errorMessage,
      },
    }));

    throw new Error(errorMessage);
  })();

  try {
    return await primaryModelDownloadPromise;
  } finally {
    primaryModelDownloadPromise = null;
  }
}

async function ensurePrimarySession(): Promise<ort.InferenceSession> {
  if (!primarySessionPromise) {
    primarySessionPromise = (async () => {
      configureRuntime();

      try {
        const initialBuffer = await ensurePrimaryModelBuffer();

        try {
          return await ort.InferenceSession.create(initialBuffer, ARC_FACE_SESSION_OPTIONS);
        } catch {
          await clearPrimaryModelCache();
          primaryModelBuffer = null;

          const refreshedBuffer = await ensurePrimaryModelBuffer({ forceRemoteDownload: true });
          return ort.InferenceSession.create(refreshedBuffer, ARC_FACE_SESSION_OPTIONS);
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'Failed to initialize primary ArcFace model.');

        setState((current) => ({
          ...current,
          primary: {
            ...current.primary,
            status: 'error',
            source: null,
            errorMessage,
          },
        }));

        throw new Error(errorMessage);
      }
    })().catch((error) => {
      primarySessionPromise = null;
      throw error;
    });
  }

  return primarySessionPromise;
}

async function ensureFallbackSession(): Promise<ort.InferenceSession> {
  if (!fallbackSessionPromise) {
    setState((current) => ({
      ...current,
      fallback: {
        status: 'loading',
        errorMessage: null,
      },
    }));

    fallbackSessionPromise = (async () => {
      configureRuntime();

      try {
        const session = await ort.InferenceSession.create(FALLBACK_MODEL_PATH, ARC_FACE_SESSION_OPTIONS);

        setState((current) => ({
          ...current,
          fallback: {
            status: 'ready',
            errorMessage: null,
          },
        }));

        return session;
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'Failed to initialize fallback ArcFace model.');

        setState((current) => ({
          ...current,
          fallback: {
            status: 'error',
            errorMessage,
          },
        }));

        throw new Error(errorMessage);
      }
    })().catch((error) => {
      fallbackSessionPromise = null;
      throw error;
    });
  }

  return fallbackSessionPromise;
}

export function getArcFaceModelState(): ArcFaceModelRuntimeState {
  return getStateSnapshot();
}

export function subscribeArcFaceModelState(listener: ArcFaceModelStateListener): () => void {
  listeners.add(listener);
  listener(getArcFaceModelState());

  return () => {
    listeners.delete(listener);
  };
}

export function prepareArcFaceModels(options?: { preloadFallback?: boolean }): void {
  void ensurePrimaryModelBuffer().catch(() => {
    // The UI may choose fallback; do not throw from background preload.
  });

  if (options?.preloadFallback) {
    void ensureFallbackSession().catch(() => {
      // Fallback is optional and should not break startup.
    });
  }
}

export async function activateFallbackArcFaceModel(): Promise<void> {
  setState((current) => ({
    ...current,
    preferredVariant: 'fallback',
    activeVariant: 'fallback',
  }));

  try {
    await ensureFallbackSession();
  } catch (error) {
    setState((current) => ({
      ...current,
      preferredVariant: 'primary',
      activeVariant: 'primary',
    }));

    throw error;
  } finally {
    void ensurePrimaryModelBuffer().catch(() => {
      // Keep trying primary in background.
    });
  }
}

export async function activatePrimaryArcFaceModel(): Promise<void> {
  setState((current) => ({
    ...current,
    preferredVariant: 'primary',
  }));

  await ensurePrimarySession();

  setState((current) => ({
    ...current,
    activeVariant: 'primary',
  }));
}

export async function getArcFaceSession(): Promise<ort.InferenceSession> {
  if (state.preferredVariant === 'fallback') {
    try {
      const fallbackSession = await ensureFallbackSession();

      setState((current) => ({
        ...current,
        activeVariant: 'fallback',
      }));

      return fallbackSession;
    } catch {
      const primarySession = await ensurePrimarySession();

      setState((current) => ({
        ...current,
        preferredVariant: 'primary',
        activeVariant: 'primary',
      }));

      return primarySession;
    }
  }

  try {
    const primarySession = await ensurePrimarySession();

    setState((current) => ({
      ...current,
      activeVariant: 'primary',
    }));

    return primarySession;
  } catch (primaryError) {
    const primaryErrorMessage = getErrorMessage(primaryError, 'Primary ArcFace model is unavailable.');

    try {
      const fallbackSession = await ensureFallbackSession();

      setState((current) => ({
        ...current,
        activeVariant: 'fallback',
      }));

      return fallbackSession;
    } catch (fallbackError) {
      const fallbackErrorMessage = getErrorMessage(fallbackError, 'Fallback ArcFace model is unavailable.');
      throw new Error(`Primary model failed: ${primaryErrorMessage}. Fallback model failed: ${fallbackErrorMessage}.`);
    }
  }
}
