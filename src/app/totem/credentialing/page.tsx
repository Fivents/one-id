'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Wifi, WifiOff } from 'lucide-react';

import {
  clearTotemToken,
  getTotemSession,
  getTotemToken,
  sendCheckIn,
  type TotemAIConfig,
  type TotemCheckInResponse,
} from '@/core/application/client-services';
import { TotemFaceRuntime } from '@/core/application/client-services/totem/totem-face-runtime.client';
import { useI18n } from '@/i18n';

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type TotemScreenState = 'idle' | 'detecting' | 'recognizing' | 'success' | 'failure' | 'offline';

const FALLBACK_AI_CONFIG: TotemAIConfig = {
  confidenceThreshold: 0.72,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: false,
  minFaceSize: 50, // Reduced to allow close-range detection with small faces
  recommendedEmbeddingModel: 'InsightFace Buffalo_L (ArcFace, 512d)',
  recommendedDetectorModel: 'SCRFD 10G (2026 production baseline)',
};

const FACE_ANALYSIS_TIMEOUT_MS = 4000;
const RESULT_MESSAGE_HOLD_MS = 1800;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutError));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export default function TotemCredentialingPage() {
  const router = useRouter();
  const { t } = useI18n();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runtimeRef = useRef<TotemFaceRuntime | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const isProcessingRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [status, setStatus] = useState<TotemScreenState>('idle');
  const [message, setMessage] = useState<string>(t('pages.totemCredentialing.approachCamera'));
  const [aiConfig, setAiConfig] = useState<TotemAIConfig>(FALLBACK_AI_CONFIG);
  const [eventName, setEventName] = useState('');
  const [connectionOnline, setConnectionOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [lastParticipant, setLastParticipant] = useState<TotemCheckInResponse['participant'] | null>(null);
  const [checkInsCount, setCheckInsCount] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const approachCameraMessage = t('pages.totemCredentialing.approachCamera');
  const noActiveEventMessage = t('pages.totemCredentialing.noActiveEvent');
  const offlineServerMessage = t('pages.totemCredentialing.offlineServer');

  const statusClass = useMemo(() => {
    if (status === 'success') return 'border-emerald-400/80 bg-emerald-500/20 text-emerald-100';
    if (status === 'failure' || status === 'offline') return 'border-rose-400/80 bg-rose-500/20 text-rose-100';
    if (status === 'recognizing') return 'border-cyan-300/80 bg-cyan-500/20 text-cyan-100';
    return 'border-white/30 bg-black/35 text-white';
  }, [status]);

  const playTone = useCallback((type: 'success' | 'error') => {
    if (typeof window === 'undefined') return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'success' ? 880 : 240;
    gainNode.gain.value = 0.02;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.14);
  }, []);

  const updateStatus = useCallback((nextStatus: TotemScreenState, nextMessage: string) => {
    setStatus(nextStatus);
    setMessage(nextMessage);
  }, []);

  const stopLoop = useCallback(() => {
    isRunningRef.current = false;

    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRuntime = useCallback(async () => {
    if (runtimeRef.current) {
      await runtimeRef.current.dispose();
      runtimeRef.current = null;
    }
  }, []);

  const runDetectionCycle = useCallback(async () => {
    if (!isRunningRef.current) return;

    const scheduleNext = (delayMs = aiConfig.detectionIntervalMs) => {
      loopTimerRef.current = window.setTimeout(() => {
        void runDetectionCycle();
      }, delayMs);
    };

    if (!connectionOnline) {
      updateStatus('offline', t('pages.totemCredentialing.offlineServer'));
      scheduleNext();
      return;
    }

    if (isProcessingRef.current) {
      scheduleNext();
      return;
    }

    const runtime = runtimeRef.current;
    const video = videoRef.current;

    if (!runtime || !video || video.readyState < 2) {
      scheduleNext();
      return;
    }

    isProcessingRef.current = true;

    try {
      const bitmap = await createImageBitmap(video);
      const analysis = await withTimeout(
        runtime.analyze(bitmap),
        FACE_ANALYSIS_TIMEOUT_MS,
        'FACE_ANALYSIS_TIMEOUT',
      );

      if (!analysis.faceCount || !analysis.face) {
        setFaceBox(null);
        setLastParticipant(null);
        updateStatus('idle', t('pages.totemCredentialing.approachCamera'));
        scheduleNext();
        return;
      }

      if (analysis.faceCount > aiConfig.maxFaces) {
        setFaceBox(null);
        setLastParticipant(null);
        updateStatus('failure', t('pages.totemCredentialing.multipleFaces'));
        playTone('error');
        scheduleNext();
        return;
      }

      const box = analysis.face.box;
      setFaceBox(box);
      updateStatus('detecting', t('pages.totemCredentialing.detecting'));

      if (!analysis.face.isBigEnough) {
        updateStatus('detecting', t('pages.totemCredentialing.moveCloser'));
        scheduleNext();
        return;
      }

      updateStatus('recognizing', t('pages.totemCredentialing.recognizing'));

      const requestStartedAt = Date.now();

      const checkInResponse = await sendCheckIn(
        {
          embedding: analysis.face.embedding,
          faceCount: analysis.faceCount,
          livenessScore: aiConfig.livenessDetection ? analysis.face.livenessScore : undefined,
          blinkDetected: aiConfig.livenessDetection ? analysis.blinkDetected : undefined,
        },
        sessionToken ?? undefined,
      );

      if (process.env.NODE_ENV !== 'production') {
        console.info('[TotemCredentialing] check-in response', {
          success: checkInResponse.success,
          code: checkInResponse.success ? 'CHECKIN_APPROVED' : checkInResponse.error.code,
          latencyMs: Date.now() - requestStartedAt,
          faceCount: analysis.faceCount,
          embeddingDimensions: analysis.face.embedding.length,
        });
      }

      if (!checkInResponse.success) {
        let shouldPlayErrorTone = true;

        if (checkInResponse.error.code === 'CHECKIN_PARTICIPANT_NOT_FOUND') {
          updateStatus('failure', t('pages.totemCredentialing.participantNotFound'));
        } else if (checkInResponse.error.code === 'CHECKIN_LOW_CONFIDENCE') {
          updateStatus('failure', t('pages.totemCredentialing.lowConfidence'));
        } else if (checkInResponse.error.code === 'CHECKIN_DUPLICATE') {
          updateStatus('failure', checkInResponse.error.message);
          shouldPlayErrorTone = false;
        } else if (checkInResponse.error.code === 'CHECKIN_MULTIPLE_FACES') {
          updateStatus('failure', t('pages.totemCredentialing.multipleFaces'));
        } else if (checkInResponse.error.code === 'CHECKIN_LOW_LIVENESS') {
          updateStatus('failure', t('pages.totemCredentialing.lowLiveness'));
        } else if (checkInResponse.error.code === 'CHECKIN_NO_BLINK') {
          updateStatus('failure', t('pages.totemCredentialing.noBlink'));
        } else if (
          checkInResponse.error.code === 'REQUEST_TIMEOUT' ||
          checkInResponse.error.code === 'REQUEST_FAILED' ||
          checkInResponse.error.code === 'UNEXPECTED_ERROR'
        ) {
          updateStatus('failure', t('pages.totemCredentialing.processingFailure'));
          shouldPlayErrorTone = false;
        } else if (
          checkInResponse.error.code === 'CHECKIN_GLOBAL_COOLDOWN' ||
          checkInResponse.error.code === 'CHECKIN_PERSON_COOLDOWN'
        ) {
          updateStatus('detecting', t('pages.totemCredentialing.waitingCooldown'));
          shouldPlayErrorTone = false;
        } else if (checkInResponse.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          clearTotemToken();
          router.replace('/totem/login');
          return;
        } else {
          updateStatus('failure', checkInResponse.error.message);
        }

        setLastParticipant(null);
        if (shouldPlayErrorTone) {
          playTone('error');
        }
        scheduleNext(RESULT_MESSAGE_HOLD_MS);
        return;
      }

      setCheckInsCount((current) => current + 1);
      setLastParticipant(checkInResponse.data.participant);
      updateStatus('success', t('pages.totemCredentialing.checkInSuccess'));
      playTone('success');
      scheduleNext(RESULT_MESSAGE_HOLD_MS);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';

      if (process.env.NODE_ENV !== 'production') {
        console.error('[TotemCredentialing] detection cycle error', {
          code,
          error,
        });
      }

      if (code === 'FACE_ANALYSIS_TIMEOUT') {
        updateStatus('failure', t('pages.totemCredentialing.processingFailure'));
      } else {
        updateStatus('failure', t('pages.totemCredentialing.processingFailure'));
      }

      scheduleNext(RESULT_MESSAGE_HOLD_MS);
    } finally {
      isProcessingRef.current = false;
    }
  }, [aiConfig, connectionOnline, playTone, router, sessionToken, t, updateStatus]);

  const waitForSessionToken = useCallback(async () => {
    const immediateToken = getTotemToken();
    if (immediateToken) {
      return immediateToken;
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 120);
      });

      const token = getTotemToken();
      if (token) {
        return token;
      }
    }

    return null;
  }, []);

  const isRetriableSessionError = useCallback((code?: string) => {
    return code === 'UNEXPECTED_ERROR' || code === 'REQUEST_FAILED' || code === 'REQUEST_TIMEOUT';
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const token = await waitForSessionToken();

      if (!token) {
        setIsSessionReady(false);
        setIsLoading(false);
        router.replace('/totem/login');
        return;
      }

      setSessionToken(token);

      let session = await getTotemSession(token);

      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (session.success || !isRetriableSessionError(session.error.code)) {
          break;
        }

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 180 * (attempt + 1));
        });

        session = await getTotemSession(token);
      }

      if (!session.success) {
        setIsSessionReady(false);
        setIsLoading(false);

        if (session.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          clearTotemToken();
          updateStatus('failure', t('pages.totemCredentialing.noActiveEvent'));
          return;
        }

        clearTotemToken();
        router.replace('/totem/login');
        return;
      }

      setEventName(session.data.activeEvent.name);
      setAiConfig(session.data.aiConfig);
      setIsSessionReady(true);
      setIsLoading(false);
    } catch {
      setIsSessionReady(false);
      setIsLoading(false);
      updateStatus('failure', t('pages.totemCredentialing.processingFailure'));
    }
  }, [isRetriableSessionError, router, t, updateStatus, waitForSessionToken]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (isLoading || !isSessionReady) return;

    let ignore = false;

    async function bootCameraAndDetector() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (ignore) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        const runtime = new TotemFaceRuntime();
        await runtime.init({
          maxFaces: Math.max(aiConfig.maxFaces, 1),
          minFaceSize: aiConfig.minFaceSize,
          livenessEnabled: aiConfig.livenessDetection,
        });

        runtimeRef.current = runtime;

        isRunningRef.current = true;
        void runDetectionCycle();
      } catch {
        updateStatus('failure', t('pages.totemCredentialing.initFailure'));
      }
    }

    void bootCameraAndDetector();

    return () => {
      ignore = true;
      stopLoop();
      stopCamera();
      void stopRuntime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiConfig.livenessDetection,
    aiConfig.maxFaces,
    aiConfig.minFaceSize,
    isLoading,
    isSessionReady,
    runDetectionCycle,
    stopCamera,
    stopLoop,
    stopRuntime,
    updateStatus,
  ]);

  useEffect(() => {
    function requestFullscreen() {
      if (document.fullscreenElement) return;
      void document.documentElement.requestFullscreen().catch(() => null);
    }

    requestFullscreen();

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        requestFullscreen();
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const blocked =
        event.key === 'F5' ||
        event.key === 'F11' ||
        event.key === 'F12' ||
        event.key === 'Escape' ||
        // DevTools shortcuts
        (event.ctrlKey && event.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(event.key)) ||
        // Refresh, close tab
        (event.ctrlKey && ['r', 'R', 'w', 'W'].includes(event.key)) ||
        // Address bar, new tab, new window
        (event.ctrlKey && ['l', 'L', 't', 'T', 'n', 'N'].includes(event.key)) ||
        // Navigation
        (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) ||
        // Alt+F4
        (event.altKey && event.key === 'F4');

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestFullscreen();
      }
    };

    window.history.pushState(null, '', window.location.href);

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setConnectionOnline(true);
    const onOffline = () => setConnectionOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!sessionToken || !isSessionReady) return;

    const interval = window.setInterval(async () => {
      const response = await getTotemSession(sessionToken);

      if (!response.success) {
        if (response.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          updateStatus('failure', noActiveEventMessage);
          return;
        }

        if (isRetriableSessionError(response.error.code)) {
          setConnectionOnline(false);
          updateStatus('offline', offlineServerMessage);
          return;
        }

        clearTotemToken();
        router.replace('/totem/login');
        return;
      }

      setEventName(response.data.activeEvent.name);
      setAiConfig(response.data.aiConfig);
      setConnectionOnline(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    isRetriableSessionError,
    isSessionReady,
    noActiveEventMessage,
    offlineServerMessage,
    router,
    sessionToken,
    updateStatus,
  ]);

  useEffect(() => {
    setMessage((current) => (current ? current : approachCameraMessage));
  }, [approachCameraMessage]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-lg">{t('pages.totemCredentialing.booting')}</p>
      </main>
    );
  }

  if (!isSessionReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 text-center backdrop-blur-md">
          <p className="text-lg font-semibold">{message || t('pages.totemCredentialing.processingFailure')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(1,6,18,0.82)_100%)]" />

      {faceBox ? (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.5),0_0_25px_rgba(34,211,238,0.35)]"
          style={{
            left: `${(faceBox.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
            top: `${(faceBox.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
            width: `${(faceBox.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
            height: `${(faceBox.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
            transition: 'all 120ms linear',
          }}
        >
          <span className="absolute -top-6 left-0 rounded-md bg-cyan-500/80 px-2 py-1 text-xs tracking-wide text-black uppercase">
            {t('pages.totemCredentialing.faceScan')}
          </span>
          <span className="absolute inset-0 animate-pulse rounded-xl border border-cyan-200/80" />
        </div>
      ) : null}

      <section className="pointer-events-none absolute top-6 right-6 left-6 flex items-start justify-between gap-4">
        <div className="rounded-xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-md">
          <p className="text-xs tracking-[0.2em] text-cyan-200 uppercase">
            {t('pages.totemCredentialing.activeEvent')}
          </p>
          <p className="text-lg font-semibold">{eventName}</p>
          <p className="text-xs text-white/70">
            {t('pages.totemCredentialing.recommendedModel')}: {aiConfig.recommendedEmbeddingModel}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            {connectionOnline ? (
              <Wifi className="h-4 w-4 text-emerald-300" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-300" />
            )}
            <span className={connectionOnline ? 'text-emerald-200' : 'text-rose-200'}>
              {connectionOnline ? t('pages.totemCredentialing.online') : t('pages.totemCredentialing.offline')}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-sm text-white/90">
            {t('pages.totemCredentialing.checkIns')}: {checkInsCount}
          </div>
        </div>
      </section>

      <section className="pointer-events-none absolute bottom-8 left-1/2 w-[min(92vw,720px)] -translate-x-1/2 space-y-4">
        <div className={`rounded-2xl border px-6 py-4 text-center backdrop-blur-md ${statusClass}`}>
          <p className="text-2xl font-semibold tracking-wide">{message}</p>
        </div>

        {lastParticipant && status === 'success' ? (
          <div className="rounded-2xl border border-emerald-300/70 bg-emerald-600/25 p-5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              {lastParticipant.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lastParticipant.imageUrl}
                  alt={lastParticipant.name}
                  className="h-20 w-20 rounded-xl border border-white/40 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/40 bg-black/20 text-sm text-white/80">
                  {t('pages.totemCredentialing.noPhoto')}
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">{lastParticipant.name}</h3>
                <p className="text-sm text-emerald-100/90">
                  {lastParticipant.company || t('pages.totemCredentialing.companyUnknown')}
                </p>
                <p className="text-sm text-emerald-100/90">
                  {lastParticipant.jobTitle || t('pages.totemCredentialing.roleUnknown')}
                </p>
                <p className="text-sm font-medium text-emerald-100">{t('pages.totemCredentialing.successLabel')}</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
