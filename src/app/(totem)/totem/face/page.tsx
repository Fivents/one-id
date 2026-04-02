'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft, Camera, CheckCircle2, Loader2, Scan, User, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { extractFaceEmbedding } from '@/core/application/client-services/totem/face-embedding.client';
import { sendCheckIn } from '@/core/application/client-services/totem/totem-client.service';

import { useTotemSession } from '../_lib/use-totem-session';

type Feedback =
  | {
      type: 'success';
      title: string;
      description: string;
      participantName?: string;
    }
  | {
      type: 'error';
      title: string;
      description: string;
    };

export default function TotemFacePage() {
  const router = useRouter();
  const { session, isLoading } = useTotemSession();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const notRecognizedStreakRef = useRef(0);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }

    if (!session.activeEvent.faceEnabled) {
      router.replace('/totem/method');
      return;
    }

    let active = true;

    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraReady(true);
        }
      } catch {
        setFeedback({
          type: 'error',
          title: 'Câmera indisponível',
          description: 'Não foi possível acessar a câmera deste dispositivo.',
        });
      }
    }

    void openCamera();

    return () => {
      active = false;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    };
  }, [isLoading, router, session]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const countdownInterval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.replace('/totem/method');
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(timeout);
    };
  }, [feedback, router]);

  const handleFaceCheckIn = useCallback(
    async (isLoopAttempt = false) => {
      const video = videoRef.current;
      if (!session || !video || video.videoWidth === 0 || video.videoHeight === 0 || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Não foi possível capturar a imagem da câmera.');
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const embeddingResult = await extractFaceEmbedding(
          { imageDataUrl },
          {
            requireSingleFace: true,
            maxFaces: session.activeEvent.faceEnabled ? session.aiConfig.maxFaces : 1,
            minFaceSize: session.aiConfig.minFaceSize,
            minDetectionConfidence: 0.6,
          },
        );

        const response = await sendCheckIn({
          method: 'FACE',
          embedding: embeddingResult.embedding,
          faceCount: embeddingResult.faceCount,
        });

        if (!response.success) {
          if (isLoopAttempt && response.error.code === 'CHECKIN_PARTICIPANT_NOT_FOUND') {
            notRecognizedStreakRef.current += 1;

            if (notRecognizedStreakRef.current < 6) {
              return;
            }

            setFeedback({
              type: 'error',
              title: 'Rosto não reconhecido',
              description: 'Não encontramos seu cadastro. Tente outro método de check-in.',
            });
            return;
          }

          throw new Error(response.error.message);
        }

        notRecognizedStreakRef.current = 0;

        setFeedback({
          type: 'success',
          title: 'Check-in realizado!',
          description: 'Seja bem-vindo(a) ao evento',
          participantName: response.data.participant.name,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha no check-in facial.';

        if (
          isLoopAttempt &&
          (message.includes('No face detected') ||
            message.includes('Detected ') ||
            message.includes('exactly one face'))
        ) {
          return;
        }

        setFeedback({
          type: 'error',
          title: 'Erro no check-in',
          description: message,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, session],
  );

  useEffect(() => {
    if (!isCameraReady || isSubmitting || feedback) {
      return;
    }

    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        await handleFaceCheckIn(true);

        if (cancelled) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    void loop();

    return () => {
      cancelled = true;
    };
  }, [feedback, handleFaceCheckIn, isCameraReady, isSubmitting]);

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  // Success state
  if (feedback?.type === 'success') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative">
          {/* Success glow */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-[60px]" />

          {/* Success card */}
          <div className="animate-in zoom-in-75 relative duration-500">
            <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-10 ring-1 ring-emerald-500/30">
              {/* Success icon */}
              <div className="relative mb-6">
                <div className="animate-totem-success-pulse absolute inset-0 rounded-full bg-emerald-500/30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="animate-in zoom-in h-14 w-14 text-white delay-200 duration-300" />
                </div>
              </div>

              {/* Text */}
              <h1 className="animate-in fade-in slide-in-from-bottom-2 text-3xl font-bold text-white delay-150 duration-300">
                {feedback.title}
              </h1>
              <p className="animate-in fade-in mt-2 text-slate-400 delay-200 duration-300">{feedback.description}</p>

              {/* Participant name */}
              {feedback.participantName && (
                <div className="animate-in fade-in slide-in-from-bottom-4 mt-6 delay-300 duration-500">
                  <p className="text-2xl font-semibold text-emerald-400">{feedback.participantName}</p>
                </div>
              )}

              {/* Countdown */}
              <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
                <span>Retornando em</span>
                <span className="font-mono text-lg text-slate-400 tabular-nums">{countdown}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (feedback?.type === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative">
          {/* Error glow */}
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-[60px]" />

          {/* Error card */}
          <div className="animate-totem-shake relative">
            <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 p-10 ring-1 ring-rose-500/30">
              {/* Error icon */}
              <div className="relative mb-6">
                <div className="animate-totem-error-pulse absolute inset-0 rounded-full bg-rose-500/30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/30">
                  <XCircle className="h-14 w-14 text-white" />
                </div>
              </div>

              {/* Text */}
              <h1 className="text-3xl font-bold text-white">{feedback.title}</h1>
              <p className="mt-2 max-w-sm text-center text-slate-400">{feedback.description}</p>

              {/* Countdown */}
              <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
                <span>Retornando em</span>
                <span className="font-mono text-lg text-slate-400 tabular-nums">{countdown}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Camera view (default state)
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Reconhecimento Facial</h1>
        <p className="mt-2 text-slate-400">Posicione seu rosto no centro da câmera</p>
      </div>

      {/* Camera container */}
      <div className="relative mx-auto w-full max-w-2xl">
        {/* Gradient border */}
        <div className="from-primary/60 absolute -inset-[2px] rounded-3xl bg-gradient-to-br via-slate-700/40 to-cyan-500/40" />

        {/* Video container */}
        <div className="relative overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />

          {/* Viewfinder corners */}
          <div className="pointer-events-none absolute inset-0">
            <div className="totem-viewfinder-corner totem-viewfinder-corner-tl" />
            <div className="totem-viewfinder-corner totem-viewfinder-corner-tr" />
            <div className="totem-viewfinder-corner totem-viewfinder-corner-bl" />
            <div className="totem-viewfinder-corner totem-viewfinder-corner-br" />
          </div>

          {/* Scan line */}
          {isCameraReady && !isSubmitting && (
            <div className="via-primary animate-totem-scan pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent to-transparent" />
          )}

          {/* Processing overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="bg-primary/30 absolute inset-0 animate-pulse rounded-full blur-xl" />
                  <div className="ring-primary/50 relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/90 ring-2">
                    <Loader2 className="text-primary h-10 w-10 animate-spin" />
                  </div>
                </div>
                <p className="font-medium text-white">Verificando identidade...</p>
              </div>
            </div>
          )}

          {/* Status indicator */}
          {isCameraReady && !isSubmitting && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white">
                  <Scan className="h-4 w-4" />
                  Escaneando automaticamente
                </span>
              </div>
            </div>
          )}

          {/* Face placeholder when camera not ready */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <User className="h-20 w-20" />
                <p>Iniciando câmera...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          size="lg"
          className="shadow-primary/25 h-14 min-w-[200px] text-base shadow-lg"
          onClick={() => void handleFaceCheckIn()}
          disabled={!isCameraReady || isSubmitting}
        >
          <Camera className="mr-2 h-5 w-5" />
          {isSubmitting ? 'Validando...' : 'Capturar Agora'}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-14 border-slate-700/50 bg-slate-800/50"
          onClick={() => router.replace('/totem/method')}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-6 text-center text-sm text-slate-500">
        <p>Mantenha o rosto centralizado e bem iluminado</p>
      </div>
    </div>
  );
}
