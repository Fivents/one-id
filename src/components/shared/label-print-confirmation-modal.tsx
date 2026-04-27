'use client';

import { useEffect, useMemo, useState } from 'react';

import { AlertCircle, Clock3, Printer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LabelPrintConfirmationModalProps = {
  open: boolean;
  participantName?: string;
  timeoutSeconds: number;
  isPrinting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onTimeout?: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'totem';
};

export function LabelPrintConfirmationModal({
  open,
  participantName,
  timeoutSeconds,
  isPrinting = false,
  onConfirm,
  onCancel,
  onTimeout,
  title = 'Imprimir etiqueta',
  description = 'Deseja imprimir a etiqueta agora?',
  confirmLabel = 'Imprimir',
  cancelLabel = 'Agora nao',
  variant = 'default',
}: LabelPrintConfirmationModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSecondsLeft(timeoutSeconds);
  }, [open, timeoutSeconds]);

  useEffect(() => {
    if (!open || isPrinting) {
      return;
    }

    if (secondsLeft <= 0) {
      onTimeout?.();
      onCancel();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, secondsLeft, isPrinting, onCancel, onTimeout]);

  const progress = useMemo(() => {
    if (timeoutSeconds <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((secondsLeft / timeoutSeconds) * 100)));
  }, [secondsLeft, timeoutSeconds]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isPrinting && onCancel()}>
      <DialogContent
        className={
          variant === 'totem'
            ? 'sm:max-w-xl border-slate-700 bg-slate-950 text-slate-100'
            : 'sm:max-w-lg border-border/70'
        }
      >
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={variant === 'totem' ? 'border-emerald-500/50 text-emerald-300' : ''}>
              <Printer className="mr-1 h-3.5 w-3.5" />
              Etiqueta
            </Badge>
            <Badge variant="outline" className={variant === 'totem' ? 'border-amber-500/50 text-amber-300' : ''}>
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {secondsLeft}s
            </Badge>
          </div>
          <DialogTitle className={variant === 'totem' ? 'text-2xl text-slate-50' : ''}>{title}</DialogTitle>
          <DialogDescription className={variant === 'totem' ? 'text-slate-300' : ''}>{description}</DialogDescription>
        </DialogHeader>

        <div className={variant === 'totem' ? 'space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4' : 'space-y-4'}>
          {participantName ? (
            <div>
              <p className={variant === 'totem' ? 'text-sm text-slate-400' : 'text-muted-foreground text-sm'}>
                Participante
              </p>
              <p className={variant === 'totem' ? 'text-lg font-semibold text-emerald-300' : 'text-lg font-semibold'}>
                {participantName}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className={variant === 'totem' ? 'h-2 w-full rounded-full bg-slate-800' : 'h-2 w-full rounded-full bg-muted'}>
              <div
                className={variant === 'totem' ? 'h-full rounded-full bg-emerald-400' : 'bg-primary h-full rounded-full'}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={variant === 'totem' ? 'text-xs text-slate-400' : 'text-muted-foreground text-xs'}>
              {isPrinting ? 'Enviando para impressora...' : `Retorno automatico em ${secondsLeft}s`}
            </p>
          </div>

          <div className={variant === 'totem' ? 'flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3' : 'flex items-start gap-2 rounded-lg border p-3'}>
            <AlertCircle className={variant === 'totem' ? 'mt-0.5 h-4 w-4 text-amber-300' : 'text-muted-foreground mt-0.5 h-4 w-4'} />
            <p className={variant === 'totem' ? 'text-xs text-slate-300' : 'text-muted-foreground text-xs'}>
              A impressao ocorre de forma silenciosa no dispositivo conectado. Caso nao exista impressora, uma mensagem
              informativa sera exibida.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" disabled={isPrinting} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" disabled={isPrinting} onClick={onConfirm}>
            {isPrinting ? 'Imprimindo...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
