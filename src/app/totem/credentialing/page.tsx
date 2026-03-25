'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, CheckCircle2, Clock, Scan, User, Wifi, WifiOff, XCircle } from 'lucide-react';

import {
  clearTotemToken,
  getTotemSession,
  getTotemToken,
  type TotemAIConfig,
} from '@/core/application/client-services';
import {
  type TotemFaceAnalysis,
  TotemFaceRuntime,
} from '@/core/application/client-services/totem/totem-face-runtime.client';
import { useI18n } from '@/i18n';

/**
 * Estados obrigatórios da UX do totem:
 * - "Aproxime-se" → aguardando rosto
 * - "Detectando..." → rosto detectado, processando
 * - "Verificando..." → liveness + embedding em andamento
 * - "Identificando..." → aguardando resposta do backend
 * - "✓ Check-in realizado" → verde, nome do participante, som de sucesso
 * - "Não reconhecido" → vermelho, orientação, som de erro
 * - "Um rosto por vez" → múltiplos rostos detectados
 * - "Rosto inválido" → liveness reprovado
 */

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type TotemScreenState =
  | 'idle' // Aproxime-se
  | 'detecting' // Detectando...
  | 'verifying' // Verificando... (liveness)
  | 'identifying' // Identificando... (matching)
  | 'success' // Check-in realizado
  | 'failure' // Não reconhecido
  | 'multiple_faces' // Um rosto por vez
  | 'invalid_face' // Rosto inválido (liveness failed)
  | 'offline'; // Offline

interface MatchedParticipant {
  id: string;
  name: string;
  company?: string | null;
  jobTitle?: string | null;
  imageUrl?: string | null;
}

interface FaceMatchResponse {
  matched: boolean;
  participant?: MatchedParticipant;
  confidence?: number;
  checkInId?: string;
  reason?: string;
  cooldownRemainingMs?: number;
}

const FALLBACK_AI_CONFIG: TotemAIConfig = {
  confidenceThreshold: 0.62,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: true,
  livenessThreshold: 0.7,
  minFaceSize: 80,
  cooldownSeconds: 8,
  efSearch: 64,
  topKCandidates: 5,
  recommendedEmbeddingModel: 'ArcFace w600k_r50 (512d)',
  recommendedDetectorModel: 'SCRFD 10G (InsightFace)',
};

const FACE_ANALYSIS_TIMEOUT_MS = 5000;
const RESULT_MESSAGE_HOLD_MS = 2000;
const API_TIMEOUT_MS = 3000;

function isSameAiConfig(current: TotemAIConfig, next: TotemAIConfig): boolean {
  return (
    current.confidenceThreshold === next.confidenceThreshold &&
    current.detectionIntervalMs === next.detectionIntervalMs &&
    current.maxFaces === next.maxFaces &&
    current.livenessDetection === next.livenessDetection &&
    current.livenessThreshold === next.livenessThreshold &&
    current.minFaceSize === next.minFaceSize &&
    current.cooldownSeconds === next.cooldownSeconds &&
    current.efSearch === next.efSearch &&
    current.topKCandidates === next.topKCandidates &&
    current.recommendedEmbeddingModel === next.recommendedEmbeddingModel &&
    current.recommendedDetectorModel === next.recommendedDetectorModel
  );
}

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

async function fetchFaceMatch(
  embedding: number[],
  eventId: string,
  totemId: string,
  livenessScore?: number,
  qualityScore?: number,
  token?: string,
): Promise<FaceMatchResponse> {
  const response = await fetch('/api/totem/face-match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      embedding,
      eventId,
      totemId,
      livenessScore,
      qualityScore,
    }),
  });

  return response.json();
}

async function sendMetrics(
  data: {
    latencyMs: number;
    confidence: number;
    matched: boolean;
    livenessScore?: number;
    failureReason?: string;
  },
  token?: string,
): Promise<void> {
  try {
    await fetch('/api/totem/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
  } catch {
    // Ignore metrics errors
  }
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
  const [message, setMessage] = useState<string>('');
  const [aiConfig, setAiConfig] = useState<TotemAIConfig>(FALLBACK_AI_CONFIG);
  const [eventId, setEventId] = useState('');
  const [totemId, setTotemId] = useState('');
  const [eventName, setEventName] = useState('');
  const [connectionOnline, setConnectionOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [lastParticipant, setLastParticipant] = useState<MatchedParticipant | null>(null);
  const [checkInsCount, setCheckInsCount] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Status messages based on state
  const statusMessages: Record<TotemScreenState, string> = useMemo(
    () => ({
      idle: t('pages.totemCredentialing.approachCamera') || 'Aproxime-se da câmera',
      detecting: t('pages.totemCredentialing.detecting') || 'Detectando...',
      verifying: t('pages.totemCredentialing.verifying') || 'Verificando...',
      identifying: t('pages.totemCredentialing.identifying') || 'Identificando...',
      success: t('pages.totemCredentialing.checkInSuccess') || '✓ Check-in realizado',
      failure: t('pages.totemCredentialing.notRecognized') || 'Não reconhecido',
      multiple_faces: t('pages.totemCredentialing.multipleFaces') || 'Um rosto por vez',
      invalid_face: t('pages.totemCredentialing.invalidFace') || 'Rosto inválido',
      offline: t('pages.totemCredentialing.offlineServer') || 'Servidor offline',
    }),
    [t],
  );

  // Status icons
  const StatusIcon = useMemo(() => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-8 w-8 text-emerald-300" />;
      case 'failure':
      case 'invalid_face':
        return <XCircle className="h-8 w-8 text-rose-300" />;
      case 'multiple_faces':
        return <AlertTriangle className="h-8 w-8 text-amber-300" />;
      case 'identifying':
      case 'verifying':
        return <Clock className="h-8 w-8 animate-spin text-cyan-300" />;
      case 'detecting':
        return <Scan className="h-8 w-8 text-cyan-300" />;
      default:
        return <User className="h-8 w-8 text-white/60" />;
    }
  }, [status]);

  const statusClass = useMemo(() => {
    switch (status) {
      case 'success':
        return 'border-emerald-400/80 bg-emerald-500/20 text-emerald-100';
      case 'failure':
      case 'invalid_face':
        return 'border-rose-400/80 bg-rose-500/20 text-rose-100';
      case 'multiple_faces':
        return 'border-amber-400/80 bg-amber-500/20 text-amber-100';
      case 'identifying':
      case 'verifying':
        return 'border-cyan-300/80 bg-cyan-500/20 text-cyan-100';
      case 'offline':
        return 'border-gray-400/80 bg-gray-500/20 text-gray-100';
      default:
        return 'border-white/30 bg-black/35 text-white';
    }
  }, [status]);

  const playTone = useCallback((type: 'success' | 'error') => {
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = type === 'success' ? 880 : 240;
      gainNode.gain.value = 0.03;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const updateStatus = useCallback((nextStatus: TotemScreenState, customMessage?: string) => {
    setStatus(nextStatus);
    setMessage(customMessage || '');
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
      updateStatus('offline');
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
    const cycleStart = Date.now();

    try {
      const bitmap = await createImageBitmap(video);

      // 1. Analyze frame
      const analysis: TotemFaceAnalysis = await withTimeout(
        runtime.analyze(bitmap),
        FACE_ANALYSIS_TIMEOUT_MS,
        'FACE_ANALYSIS_TIMEOUT',
      );

      // No face detected
      if (analysis.faceCount === 0 || !analysis.face) {
        setFaceBox(null);
        setLastParticipant(null);
        updateStatus('idle');
        scheduleNext();
        return;
      }

      // Multiple faces
      if (analysis.faceCount > aiConfig.maxFaces) {
        setFaceBox(null);
        setLastParticipant(null);
        updateStatus('multiple_faces');
        playTone('error');
        scheduleNext(RESULT_MESSAGE_HOLD_MS);
        return;
      }

      // Update face box
      setFaceBox(analysis.face.box);
      updateStatus('detecting');

      // Face too small
      if (!analysis.face.isBigEnough) {
        updateStatus('detecting', t('pages.totemCredentialing.moveCloser') || 'Aproxime-se mais');
        scheduleNext();
        return;
      }

      // Check liveness if enabled
      if (aiConfig.livenessDetection && analysis.liveness) {
        updateStatus('verifying');

        if (!analysis.liveness.isLive || analysis.liveness.score < (aiConfig.livenessThreshold ?? 0.7)) {
          updateStatus('invalid_face');
          playTone('error');
          await sendMetrics(
            {
              latencyMs: Date.now() - cycleStart,
              confidence: 0,
              matched: false,
              livenessScore: analysis.liveness.score,
              failureReason: 'liveness_failed',
            },
            sessionToken ?? undefined,
          );
          scheduleNext(RESULT_MESSAGE_HOLD_MS);
          return;
        }
      }

      // Check quality
      if (analysis.face.qualityScore < 0.5) {
        updateStatus('detecting', t('pages.totemCredentialing.improvePosition') || 'Melhore sua posição');
        scheduleNext();
        return;
      }

      // Has embedding?
      if (!analysis.face.embedding || analysis.face.embedding.length !== 512) {
        updateStatus('detecting');
        scheduleNext();
        return;
      }

      // 2. Send to backend for matching
      updateStatus('identifying');

      const matchResponse = await withTimeout(
        fetchFaceMatch(
          analysis.face.embedding,
          eventId,
          totemId,
          analysis.liveness?.score,
          analysis.face.qualityScore,
          sessionToken ?? undefined,
        ),
        API_TIMEOUT_MS,
        'API_TIMEOUT',
      );

      const latencyMs = Date.now() - cycleStart;

      // Log metrics
      await sendMetrics(
        {
          latencyMs,
          confidence: matchResponse.confidence ?? 0,
          matched: matchResponse.matched,
          livenessScore: analysis.liveness?.score,
          failureReason: matchResponse.matched ? undefined : matchResponse.reason,
        },
        sessionToken ?? undefined,
      );

      // Handle response
      if (matchResponse.matched && matchResponse.participant) {
        setCheckInsCount((c) => c + 1);
        setLastParticipant(matchResponse.participant);
        updateStatus('success');
        playTone('success');
        scheduleNext(RESULT_MESSAGE_HOLD_MS);
        return;
      }

      // Not matched
      setLastParticipant(null);

      switch (matchResponse.reason) {
        case 'below_threshold':
          updateStatus('failure', t('pages.totemCredentialing.lowConfidence') || 'Não foi possível identificar');
          break;
        case 'cooldown':
          updateStatus('detecting', t('pages.totemCredentialing.waitingCooldown') || 'Aguarde um momento');
          scheduleNext(matchResponse.cooldownRemainingMs || 2000);
          return;
        case 'not_registered':
          updateStatus('failure', t('pages.totemCredentialing.participantNotFound') || 'Participante não cadastrado');
          break;
        case 'liveness_failed':
          updateStatus('invalid_face');
          break;
        default:
          updateStatus('failure');
      }

      playTone('error');
      scheduleNext(RESULT_MESSAGE_HOLD_MS);
    } catch (error) {
      console.error('[TotemCredentialing] Detection cycle error:', error);
      updateStatus('failure', t('pages.totemCredentialing.processingFailure') || 'Erro no processamento');
      scheduleNext(RESULT_MESSAGE_HOLD_MS);
    } finally {
      isProcessingRef.current = false;
    }
  }, [aiConfig, connectionOnline, eventId, totemId, playTone, sessionToken, t, updateStatus]);

  const waitForSessionToken = useCallback(async () => {
    const immediateToken = getTotemToken();
    if (immediateToken) return immediateToken;

    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const token = getTotemToken();
      if (token) return token;
    }

    return null;
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

      const session = await getTotemSession(token);

      if (!session.success) {
        setIsSessionReady(false);
        setIsLoading(false);

        if (session.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          clearTotemToken();
          updateStatus('failure', t('pages.totemCredentialing.noActiveEvent') || 'Nenhum evento ativo');
          return;
        }

        clearTotemToken();
        router.replace('/totem/login');
        return;
      }

      setEventId(session.data.activeEvent.id);
      setTotemId(session.data.totem.id);
      setEventName(session.data.activeEvent.name);
      setAiConfig(session.data.aiConfig);
      setIsSessionReady(true);
      setIsLoading(false);
    } catch {
      setIsSessionReady(false);
      setIsLoading(false);
      updateStatus('failure', t('pages.totemCredentialing.processingFailure') || 'Erro ao carregar sessão');
    }
  }, [router, t, updateStatus, waitForSessionToken]);

  // Initialize session
  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  // Boot camera and face runtime
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
          livenessThreshold: aiConfig.livenessThreshold ?? 0.7,
          confidenceThreshold: aiConfig.confidenceThreshold,
          modelsPath: '/models',
        });

        runtimeRef.current = runtime;

        isRunningRef.current = true;
        void runDetectionCycle();
      } catch (error) {
        console.error('[TotemCredentialing] Boot error:', error);
        updateStatus('failure', t('pages.totemCredentialing.initFailure') || 'Erro ao inicializar câmera');
      }
    }

    void bootCameraAndDetector();

    return () => {
      ignore = true;
      stopLoop();
      stopCamera();
      void stopRuntime();
    };
  }, [aiConfig, isLoading, isSessionReady, runDetectionCycle, stopCamera, stopLoop, stopRuntime, t, updateStatus]);

  // Fullscreen kiosk mode
  useEffect(() => {
    function requestFullscreen() {
      if (document.fullscreenElement) return;
      void document.documentElement.requestFullscreen().catch(() => null);
    }

    requestFullscreen();

    const handlers = {
      fullscreenchange: () => !document.fullscreenElement && requestFullscreen(),
      contextmenu: (e: Event) => e.preventDefault(),
      keydown: (e: KeyboardEvent) => {
        const blocked =
          e.key === 'F5' ||
          e.key === 'F11' ||
          e.key === 'F12' ||
          e.key === 'Escape' ||
          (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) ||
          (e.ctrlKey && ['r', 'R', 'w', 'W', 'l', 'L', 't', 'T', 'n', 'N'].includes(e.key)) ||
          (e.altKey && ['ArrowLeft', 'ArrowRight', 'F4'].includes(e.key));
        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      popstate: () => window.history.pushState(null, '', window.location.href),
      beforeunload: (e: BeforeUnloadEvent) => e.preventDefault(),
      visibilitychange: () => document.visibilityState === 'visible' && requestFullscreen(),
    };

    window.history.pushState(null, '', window.location.href);

    document.addEventListener('fullscreenchange', handlers.fullscreenchange);
    document.addEventListener('contextmenu', handlers.contextmenu);
    document.addEventListener('visibilitychange', handlers.visibilitychange);
    window.addEventListener('keydown', handlers.keydown, true);
    window.addEventListener('popstate', handlers.popstate);
    window.addEventListener('beforeunload', handlers.beforeunload);

    return () => {
      document.removeEventListener('fullscreenchange', handlers.fullscreenchange);
      document.removeEventListener('contextmenu', handlers.contextmenu);
      document.removeEventListener('visibilitychange', handlers.visibilitychange);
      window.removeEventListener('keydown', handlers.keydown, true);
      window.removeEventListener('popstate', handlers.popstate);
      window.removeEventListener('beforeunload', handlers.beforeunload);
    };
  }, []);

  // Network status
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

  // Periodic session refresh
  useEffect(() => {
    if (!sessionToken || !isSessionReady) return;

    const interval = window.setInterval(async () => {
      const response = await getTotemSession(sessionToken);

      if (!response.success) {
        if (response.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          updateStatus('failure', t('pages.totemCredentialing.noActiveEvent') || 'Nenhum evento ativo');
          return;
        }

        setConnectionOnline(false);
        updateStatus('offline');
        return;
      }

      setEventName(response.data.activeEvent.name);
      setAiConfig((current) => (isSameAiConfig(current, response.data.aiConfig) ? current : response.data.aiConfig));
      setConnectionOnline(true);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isSessionReady, sessionToken, t, updateStatus]);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="text-lg">{t('pages.totemCredentialing.booting') || 'Inicializando...'}</p>
        </div>
      </main>
    );
  }

  // Session not ready
  if (!isSessionReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 text-center backdrop-blur-md">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
          <p className="text-lg font-semibold">
            {message || t('pages.totemCredentialing.processingFailure') || 'Erro ao carregar'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* Video feed */}
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(1,6,18,0.82)_100%)]" />

      {/* Face detection box */}
      {faceBox && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.5),0_0_25px_rgba(34,211,238,0.35)] transition-all duration-100"
          style={{
            left: `${(faceBox.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
            top: `${(faceBox.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
            width: `${(faceBox.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
            height: `${(faceBox.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
          }}
        >
          <span className="absolute -top-6 left-0 rounded-md bg-cyan-500/80 px-2 py-1 text-xs tracking-wide text-black uppercase">
            {t('pages.totemCredentialing.faceScan') || 'Escaneando'}
          </span>
          <span className="absolute inset-0 animate-pulse rounded-xl border border-cyan-200/80" />
        </div>
      )}

      {/* Header */}
      <section className="pointer-events-none absolute top-6 right-6 left-6 flex items-start justify-between gap-4">
        <div className="rounded-xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-md">
          <p className="text-xs tracking-[0.2em] text-cyan-200 uppercase">
            {t('pages.totemCredentialing.activeEvent') || 'Evento Ativo'}
          </p>
          <p className="text-lg font-semibold">{eventName}</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            {connectionOnline ? (
              <Wifi className="h-4 w-4 text-emerald-300" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-300" />
            )}
            <span className={connectionOnline ? 'text-emerald-200' : 'text-rose-200'}>
              {connectionOnline
                ? t('pages.totemCredentialing.online') || 'Online'
                : t('pages.totemCredentialing.offline') || 'Offline'}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-sm text-white/90">
            {t('pages.totemCredentialing.checkIns') || 'Check-ins'}: {checkInsCount}
          </div>
        </div>
      </section>

      {/* Status panel */}
      <section className="pointer-events-none absolute bottom-8 left-1/2 w-[min(92vw,720px)] -translate-x-1/2 space-y-4">
        <div className={`rounded-2xl border px-6 py-5 backdrop-blur-md ${statusClass}`}>
          <div className="flex items-center justify-center gap-3">
            {StatusIcon}
            <p className="text-2xl font-semibold tracking-wide">{message || statusMessages[status]}</p>
          </div>
        </div>

        {/* Participant card on success */}
        {lastParticipant && status === 'success' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-emerald-300/70 bg-emerald-600/25 p-5 backdrop-blur-md duration-300">
            <div className="flex items-center gap-4">
              {lastParticipant.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lastParticipant.imageUrl}
                  alt={lastParticipant.name}
                  className="h-20 w-20 rounded-xl border border-white/40 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/40 bg-black/20">
                  <User className="h-10 w-10 text-white/60" />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">{lastParticipant.name}</h3>
                {lastParticipant.company && <p className="text-sm text-emerald-100/90">{lastParticipant.company}</p>}
                {lastParticipant.jobTitle && <p className="text-sm text-emerald-100/90">{lastParticipant.jobTitle}</p>}
                <p className="text-sm font-medium text-emerald-100">
                  {t('pages.totemCredentialing.successLabel') || '✓ Bem-vindo!'}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
