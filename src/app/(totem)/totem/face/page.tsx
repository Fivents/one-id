'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Camera, CameraOff, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { extractFaceEmbedding } from '@/core/application/client-services/totem/face-embedding.client';
import { sendCheckIn } from '@/core/application/client-services/totem/totem-client.service';

import { useTotemSession } from '../_lib/use-totem-session';

type Feedback =
  | {
      type: 'success';
      title: string;
      description: string;
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
          title: 'Falha na câmera',
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

    const timeout = window.setTimeout(() => {
      router.replace('/totem/method');
    }, 3000);

    return () => {
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
              description: 'Não encontramos um participante válido com este rosto. Retornando...',
            });
            return;
          }

          throw new Error(response.error.message);
        }

        notRecognizedStreakRef.current = 0;

        setFeedback({
          type: 'success',
          title: 'Check-in aprovado',
          description: `Bem-vindo(a), ${response.data.participant.name}. Retornando...`,
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
          title: 'Check-in não aprovado',
          description: `${message} Retornando...`,
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
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Carregando sessão...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle>Check-in Facial</CardTitle>
          <CardDescription>Posicione o rosto centralizado e com boa iluminação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-black">
            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleFaceCheckIn()} disabled={!isCameraReady || isSubmitting}>
              <Camera className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Validando...' : 'Capturar e Validar'}
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
