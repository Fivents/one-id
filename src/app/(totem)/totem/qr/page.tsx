'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, QrCode, RotateCcw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { sendCheckIn } from '@/core/application/client-services/totem/totem-client.service';

import { useTotemSession } from '../_lib/use-totem-session';

type Feedback = {
  type: 'success' | 'error';
  title: string;
  description: string;
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
          description: `${response.error.message} Retornando...`,
        });
        setIsSubmitting(false);
        return;
      }

      setFeedback({
        type: 'success',
        title: 'Check-in aprovado',
        description: `Bem-vindo(a), ${response.data.participant.name}. Retornando...`,
      });
      setIsSubmitting(false);
    },
    [isSubmitting, qrCodeValue],
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
        setScannerError('Não foi possível iniciar a câmera para leitura de QR.');
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
            setScannerError('Scanner nativo indisponível. Modo compatível de leitura ativado.');
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

    const timeout = window.setTimeout(() => {
      router.replace('/totem/method');
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [feedback, router]);

  if (isLoading || !session) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Carregando sessão...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle>Check-in por QR Code</CardTitle>
          <CardDescription>Use o leitor de QR ou digite o valor abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-black">
            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
          </div>

          {scannerError ? <p className="text-xs text-amber-400">{scannerError}</p> : null}

          <Input
            value={qrCodeValue}
            autoFocus
            onChange={(event) => setQrCodeValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSubmit();
              }
            }}
            className="border-slate-700 bg-slate-950"
            placeholder="Valor do QR"
          />

          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700" disabled={!isScannerReady}>
              <Camera className="mr-2 h-4 w-4" />
              {isScannerReady ? 'Scanner ativo' : 'Scanner indisponível'}
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !qrCodeValue.trim()}>
              <QrCode className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Validando...' : 'Validar QR'}
            </Button>
            <Button variant="outline" className="border-slate-700" onClick={() => router.replace('/totem/method')}>
              <CameraOff className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Card className="border-slate-800 bg-slate-900/80">
          <CardContent className="flex items-center gap-3 p-4">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <div>
              <p className="text-sm font-medium">{feedback.title}</p>
              <p className="text-sm text-slate-400">{feedback.description}</p>
            </div>
            <RotateCcw className="ml-auto h-4 w-4 text-slate-500" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
