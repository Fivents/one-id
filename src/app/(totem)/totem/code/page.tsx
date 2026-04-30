'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft, CheckCircle2, Hash, KeyRound, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  fetchPrintConfig,
  logPrintAttempt,
  printBadge,
  type PrintParticipantData,
} from '@/core/application/client-services/totem/print.client';
import { sendCheckIn } from '@/core/application/client-services/totem/totem-client.service';

import { LabelPrintConfirmationModal } from '@/components/shared/label-print-confirmation-modal';
import { useTotemSession } from '../_lib/use-totem-session';

type Feedback = {
  type: 'success' | 'error';
  title: string;
  description: string;
  participantName?: string;
};

export default function TotemCodePage() {
  const router = useRouter();
  const { session, isLoading } = useTotemSession();
  const inputRef = useRef<HTMLInputElement>(null);

  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [countdown, setCountdown] = useState(3);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printParticipantData, setPrintParticipantData] = useState<PrintParticipantData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }

    if (!session.activeEvent.codeEnabled) {
      router.replace('/totem/method');
    }
  }, [isLoading, router, session]);

  useEffect(() => {
    if (!feedback || isPrintModalOpen) {
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
  }, [feedback, router, isPrintModalOpen]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        title: 'Código inválido',
        description: response.error.message,
      });
      setIsSubmitting(false);
      return;
    }

    if (session?.activeEvent.hasPrintConfig) {
      const participantData: PrintParticipantData = {
        name: response.data.participant.name,
        company: response.data.participant.company,
        jobTitle: response.data.participant.jobTitle,
        participantId: response.data.eventParticipantId,
        checkInId: response.data.id,
        eventName: session.activeEvent.name,
        eventId: session.activeEvent.id,
      };

      if (session.activeEvent.labelPrintPromptEnabled) {
        setPrintParticipantData(participantData);
        setIsPrintModalOpen(true);
      } else {
        // Trigger print in background (non-blocking)
        void (async () => {
          try {
            const printConfig = await fetchPrintConfig(session.activeEvent.id);
            if (printConfig) {
              const result = await printBadge(printConfig, participantData);
              logPrintAttempt(session.activeEvent.id, response.data.eventParticipantId, result);
            }
          } catch (printError) {
            console.error('[TotemCode] Print error (non-blocking):', printError);
          }
        })();
      }
    }

    setFeedback({
      type: 'success',
      title: 'Check-in realizado!',
      description: 'Seja bem-vindo(a) ao evento',
      participantName: response.data.participant.name,
    });
    setIsSubmitting(false);
  }

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
        
        <LabelPrintConfirmationModal
          open={isPrintModalOpen}
          variant="totem"
          participantName={printParticipantData?.name}
          timeoutSeconds={session?.activeEvent?.labelPrintPromptTimeoutSeconds || 15}
          isPrinting={isPrinting}
          onCancel={() => {
            setIsPrintModalOpen(false);
            router.replace('/totem/method');
          }}
          onConfirm={async () => {
            if (!printParticipantData || !session?.activeEvent) return;
            setIsPrinting(true);
            try {
              const printConfig = await fetchPrintConfig(session.activeEvent.id);
              if (printConfig) {
                const result = await printBadge(printConfig, printParticipantData);
                logPrintAttempt(session.activeEvent.id, printParticipantData.participantId, result);
              }
            } finally {
              setIsPrinting(false);
              setIsPrintModalOpen(false);
              router.replace('/totem/method');
            }
          }}
          onTimeout={() => {
            setIsPrintModalOpen(false);
            router.replace('/totem/method');
          }}
        />
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

  // Input view
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 ring-1 ring-emerald-500/30">
            <KeyRound className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Código de Acesso</h1>
          <p className="mt-2 text-slate-400">Digite o código fornecido no seu ingresso</p>
        </div>

        {/* Input card */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-emerald-500/40 via-slate-700/30 to-teal-500/30" />

          <div className="relative rounded-3xl bg-slate-900/95 p-8">
            {/* Code input */}
            <div className="relative">
              <Hash className="absolute top-1/2 left-4 h-6 w-6 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleSubmit();
                  }
                }}
                className="h-16 w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 pr-4 pl-14 text-center font-mono text-2xl font-bold tracking-[0.3em] text-white uppercase transition-all placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="ABC123"
                maxLength={20}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>

            {/* Submit button */}
            <Button
              className="mt-6 h-14 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
              disabled={isSubmitting || !accessCode.trim()}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  Validar Código
                  <span className="ml-2 opacity-60">→</span>
                </>
              )}
            </Button>

            {/* Help text */}
            <p className="mt-4 text-center text-sm text-slate-500">
              O código está no seu e-mail de confirmação ou ingresso impresso
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-8 flex justify-center">
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
      </div>
    </div>
  );
}
