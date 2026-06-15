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

  const isTotem = variant === 'totem';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isPrinting && onCancel()}>
      <DialogContent
        className={
          isTotem ? 'border-slate-700 bg-slate-950 text-slate-100 sm:max-w-xl' : 'border-border/70 sm:max-w-lg'
        }
      >
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={isTotem ? 'border-emerald-500/50 text-emerald-300' : ''}>
              <Printer className="mr-1 h-3.5 w-3.5" />
              Etiqueta
            </Badge>
            <Badge variant="outline" className={isTotem ? 'border-amber-500/50 text-amber-300' : ''}>
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {secondsLeft}s
            </Badge>
          </div>
          <DialogTitle className={isTotem ? 'text-2xl text-slate-50' : ''}>{title}</DialogTitle>
          <DialogDescription className={isTotem ? 'text-slate-300' : ''}>{description}</DialogDescription>
        </DialogHeader>

        <div className={isTotem ? 'space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4' : 'space-y-4'}>
          {/* Mini badge preview */}
          {participantName ? (
            <div
              className={`rounded-lg border p-4 ${isTotem ? 'border-slate-700 bg-slate-800/50' : 'border-border bg-muted/30'}`}
            >
              <div className="flex items-center gap-3">
                {/* Mini label simulation - landscape */}
                <div
                  className="flex-shrink-0 rounded-sm border shadow-sm flex"
                  style={{
                    width: '78px',
                    height: '48px',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  {/* QR side */}
                  <div className="flex items-center justify-center" style={{ width: '42%', minHeight: '100%' }}>
                    <div
                      className="rounded-sm border border-black/15"
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 3px 3px',
                      }}
                    />
                  </div>
                  {/* Info side */}
                  <div className="flex flex-col justify-center px-1" style={{ width: '58%', minHeight: '100%' }}>
                    <div className="mb-0.5 h-[2px] w-[60%] rounded-full bg-indigo-300" />
                    <div className="mb-0.5 h-[3px] w-[90%] rounded-full bg-black/80" />
                    <div className="mb-0.5 h-[2px] w-[70%] rounded-full bg-black/50" />
                    <div className="flex gap-1">
                      <div className="h-[2px] w-[30%] rounded-full bg-slate-300" />
                      <div className="h-[2px] w-[40%] rounded-full bg-indigo-300" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${isTotem ? 'text-slate-400' : 'text-muted-foreground'}`}>Participante</p>
                  <p className={`truncate text-lg font-bold ${isTotem ? 'text-emerald-300' : 'text-foreground'}`}>
                    {participantName}
                  </p>
                  <p className={`mt-0.5 text-xs ${isTotem ? 'text-slate-500' : 'text-muted-foreground'}`}>
                    Etiqueta pronta para impressão
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className={isTotem ? 'h-2 w-full rounded-full bg-slate-800' : 'bg-muted h-2 w-full rounded-full'}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${isTotem ? 'bg-emerald-400' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={isTotem ? 'text-xs text-slate-400' : 'text-muted-foreground text-xs'}>
              {isPrinting ? 'Enviando para impressora...' : `Retorno automatico em ${secondsLeft}s`}
            </p>
          </div>

          <div
            className={
              isTotem
                ? 'flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3'
                : 'flex items-start gap-2 rounded-lg border p-3'
            }
          >
            <AlertCircle
              className={isTotem ? 'mt-0.5 h-4 w-4 text-amber-300' : 'text-muted-foreground mt-0.5 h-4 w-4'}
            />
            <p className={isTotem ? 'text-xs text-slate-300' : 'text-muted-foreground text-xs'}>
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
