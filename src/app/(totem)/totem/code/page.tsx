'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CheckCircle2, KeyRound, RotateCcw, XCircle } from 'lucide-react';

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

export default function TotemCodePage() {
  const router = useRouter();
  const { session, isLoading } = useTotemSession();

  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }

    if (!session.activeEvent.codeEnabled) {
      router.replace('/totem/method');
    }
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

  async function handleSubmit() {
    if (!accessCode.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const response = await sendCheckIn({
      method: 'CODE',
      accessCode: accessCode.trim().toUpperCase(),
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
  }

  if (isLoading || !session) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Carregando sessão...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle>Check-in por Código</CardTitle>
          <CardDescription>Digite o código de acesso do participante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={accessCode}
            autoFocus
            onChange={(event) => setAccessCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSubmit();
              }
            }}
            className="border-slate-700 bg-slate-950 uppercase"
            placeholder="Código de acesso"
          />

          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !accessCode.trim()}>
              <KeyRound className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Validando...' : 'Validar Código'}
            </Button>
            <Button variant="outline" className="border-slate-700" onClick={() => router.replace('/totem/method')}>
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
