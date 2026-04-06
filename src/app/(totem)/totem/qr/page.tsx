'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import jsQR from 'jsqr';
import { ArrowLeft, CheckCircle2, Keyboard, Loader2, QrCode, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchPrintConfig,
  logPrintAttempt,
  printBadge,
  type PrintParticipantData,
} from '@/core/application/client-services/totem/print.client';
import { sendCheckIn } from '@/core/application/client-services/totem/totem-client.service';

import { useTotemSession } from '../_lib/use-totem-session';

type Feedback = {
  type: 'success' | 'error';
  title: string;
  description: string;
  participantName?: string;
};

export default function TotemQrPage() {
  const router = useRouter();
  const { session, isLoading } = useTotemSession();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [showManualInput, setShowManualInput] = useState(false);

  const handleSubmit = useCallback(
    async (scannedValue?: string) => {
      const value = scannedValue ?? qrCodeValue;

      if (!value.trim() || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      const response = await sendCheckIn({
        method: 'QR',
        qrCodeValue: value.trim(),
      });

      if (!response.success) {
        setFeedback({
          type: 'error',
          title: 'Check-in não aprovado',
          description: response.error.message,
        });
        setIsSubmitting(false);
        return;
      }

      // Trigger print in background (non-blocking)
      if (session) {
        void (async () => {
          try {
            const printConfig = await fetchPrintConfig(session.activeEvent.id);
            if (printConfig) {
              const participantData: PrintParticipantData = {
                name: response.data.participant.name,
                company: response.data.participant.company,
                jobTitle: response.data.participant.jobTitle,
                participantId: response.data.eventParticipantId,
                checkInId: response.data.id,
                eventName: session.activeEvent.name,
                eventId: session.activeEvent.id,
              };
              const result = await printBadge(printConfig, participantData);
              logPrintAttempt(session.activeEvent.id, response.data.eventParticipantId, result);
            }
          } catch (printError) {
            console.error('[TotemQR] Print error (non-blocking):', printError);
          }
        })();
      }

      setFeedback({
        type: 'success',
        title: 'Check-in realizado!',
        description: 'Seja bem-vindo(a) ao evento',
        participantName: response.data.participant.name,
      });
      setIsSubmitting(false);
    },
    [isSubmitting, qrCodeValue, session],
  );

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }

    if (!session.activeEvent.qrEnabled) {
      router.replace('/totem/method');
    }
  }, [isLoading, router, session]);

  useEffect(() => {
    if (!session || isLoading || !session.activeEvent.qrEnabled) {
      return;
    }

    let active = true;

    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
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
        }

        setIsScannerReady(true);
        setScannerError(null);
      } catch {
        setIsScannerReady(false);
        setScannerError('Câmera indisponível. Use a entrada manual.');
        setShowManualInput(true);
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

      setIsScannerReady(false);
    };
  }, [isLoading, session]);

  useEffect(() => {
    if (!isScannerReady || !videoRef.current || feedback || isSubmitting) {
      return;
    }

    type BarcodeResult = { rawValue?: string };
    type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<BarcodeResult[]>;
    };

    const BarcodeDetectorRef = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

    let detector = BarcodeDetectorRef ? new BarcodeDetectorRef({ formats: ['qr_code'] }) : null;
    let cancelled = false;

    function decodeWithJsQr(video: HTMLVideoElement): string | null {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        return null;
      }

      if (!fallbackCanvasRef.current) {
        fallbackCanvasRef.current = document.createElement('canvas');
      }

      const canvas = fallbackCanvasRef.current;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const decoded = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
      return decoded?.data?.trim() ?? null;
    }

    async function scanLoop() {
      while (!cancelled) {
        if (!videoRef.current || isSubmitting || feedback) {
          await new Promise((resolve) => setTimeout(resolve, 120));
          continue;
        }

        let rawValue: string | null = null;

        if (detector) {
          try {
            const detections = await detector.detect(videoRef.current);
            rawValue = detections[0]?.rawValue?.trim() ?? null;
          } catch {
            detector = null;
            setScannerError('Usando modo de leitura compatível.');
          }
        }

        if (!rawValue) {
          rawValue = decodeWithJsQr(videoRef.current);
        }

        if (rawValue) {
          setScannerError(null);
          setQrCodeValue(rawValue);
          await handleSubmit(rawValue);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }

    void scanLoop();

    return () => {
      cancelled = true;
    };
  }, [feedback, handleSubmit, isScannerReady, isSubmitting]);

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
          <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-[60px]" />
          <div className="animate-in zoom-in-75 relative duration-500">
            <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-10 ring-1 ring-emerald-500/30">
              <div className="relative mb-6">
                <div className="animate-totem-success-pulse absolute inset-0 rounded-full bg-emerald-500/30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="animate-in zoom-in h-14 w-14 text-white delay-200 duration-300" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white">{feedback.title}</h1>
              <p className="mt-2 text-slate-400">{feedback.description}</p>
              {feedback.participantName && (
                <div className="mt-6">
                  <p className="text-2xl font-semibold text-emerald-400">{feedback.participantName}</p>
                </div>
              )}
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
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-[60px]" />
          <div className="animate-totem-shake relative">
            <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 p-10 ring-1 ring-rose-500/30">
              <div className="relative mb-6">
                <div className="animate-totem-error-pulse absolute inset-0 rounded-full bg-rose-500/30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/30">
                  <XCircle className="h-14 w-14 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white">{feedback.title}</h1>
              <p className="mt-2 max-w-sm text-center text-slate-400">{feedback.description}</p>
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

  // Scanner view
  return (
    <div className="flex flex-1 flex-col px-4">
      {/* Header - compact */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-white">QR Code</h1>
        <p className="mt-1 text-sm text-slate-400">Aponte a câmera para o QR Code do seu ingresso</p>
      </div>

      {/* Camera container - fills available space */}
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {/* Subtle border */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-cyan-500/30 via-slate-700/20 to-cyan-500/30" />

        <div className="relative flex-1 overflow-hidden rounded-3xl bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Minimal viewfinder corners */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-4 left-4 h-12 w-12 rounded-tl-xl border-t-2 border-l-2 border-white/30" />
            <div className="absolute top-4 right-4 h-12 w-12 rounded-tr-xl border-t-2 border-r-2 border-white/30" />
            <div className="absolute bottom-4 left-4 h-12 w-12 rounded-bl-xl border-b-2 border-l-2 border-white/30" />
            <div className="absolute right-4 bottom-4 h-12 w-12 rounded-br-xl border-r-2 border-b-2 border-white/30" />
          </div>

          {/* Center target - subtle */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border border-dashed border-white/20" />
          </div>

          {/* Processing overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/90 ring-2 ring-cyan-500/50">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                </div>
                <p className="text-lg font-medium text-white">Validando...</p>
              </div>
            </div>
          )}

          {/* Status indicator - minimal */}
          {isScannerReady && !isSubmitting && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                <span className="text-sm text-white/80">Scanner ativo</span>
              </div>
            </div>
          )}

          {/* Camera not ready */}
          {!isScannerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <QrCode className="h-20 w-20" />
                <p>Iniciando scanner...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanner error message */}
      {scannerError && (
        <div className="mt-4 rounded-xl bg-amber-500/10 px-5 py-4 text-center text-base text-amber-400">
          {scannerError}
        </div>
      )}

      {/* Manual input toggle */}
      <div className="mt-5">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="mx-auto flex items-center gap-2 rounded-full bg-slate-800/50 px-5 py-3 text-base text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
        >
          <Keyboard className="h-5 w-5" />
          {showManualInput ? 'Ocultar entrada manual' : 'Digitar código manualmente'}
        </button>
      </div>

      {/* Manual input */}
      {showManualInput && (
        <div className="animate-in fade-in slide-in-from-top-2 mx-auto mt-4 w-full max-w-lg duration-300">
          <div className="rounded-2xl bg-slate-800/50 p-5">
            <Input
              value={qrCodeValue}
              onChange={(event) => setQrCodeValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSubmit();
                }
              }}
              className="h-16 border-slate-600/50 bg-slate-900/50 text-center font-mono text-xl tracking-widest uppercase"
              placeholder="Digite o código"
            />
            <Button
              className="mt-4 h-14 w-full text-lg"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !qrCodeValue.trim()}
            >
              <QrCode className="mr-2 h-6 w-6" />
              {isSubmitting ? 'Validando...' : 'Validar Código'}
            </Button>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mt-5 flex justify-center pb-4">
        <Button
          variant="outline"
          size="lg"
          className="h-16 border-slate-700/50 bg-slate-800/50 text-lg"
          onClick={() => router.replace('/totem/method')}
        >
          <ArrowLeft className="mr-2 h-6 w-6" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
