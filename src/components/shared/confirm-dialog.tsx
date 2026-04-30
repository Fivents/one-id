'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  /** For destructive actions: require user to type this text to confirm */
  requireText?: string;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);
  const [typedText, setTypedText] = useState('');

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setTypedText('');
      setOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolver?.(true);
    setResolver(null);
    setOptions(null);
  };

  const handleCancel = () => {
    setOpen(false);
    resolver?.(false);
    setResolver(null);
    setOptions(null);
  };

  const isTextRequired = !!options?.requireText;
  const textMatches = !isTextRequired || typedText === options.requireText;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {options?.variant === 'destructive' && (
              <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-6 w-6" />
              </div>
            )}
            <DialogTitle className={options?.variant === 'destructive' ? 'text-center' : ''}>
              {options?.title}
            </DialogTitle>
            <DialogDescription className={options?.variant === 'destructive' ? 'text-center' : ''}>
              {options?.description}
            </DialogDescription>
          </DialogHeader>
          {isTextRequired && (
            <div className="space-y-2 py-2">
              <Label>
                {t('confirm.typeTo')} <span className="font-semibold">{options.requireText}</span>{' '}
                {t('confirm.toConfirm')}
              </Label>
              <Input
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={t('confirm.deleteConfirmPlaceholder')}
                autoComplete="off"
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              {options?.cancelLabel ?? t('common.actions.cancel')}
            </Button>
            <Button
              variant={options?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={!textMatches}
            >
              {options?.confirmLabel ?? t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
