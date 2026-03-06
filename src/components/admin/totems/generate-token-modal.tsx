'use client';

import { useState } from 'react';

import { Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { useI18n } from '@/i18n';

interface GenerateTokenModalProps {
  totem: AdminTotemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateTokenModal({ totem, open, onOpenChange }: GenerateTokenModalProps) {
  const { t } = useI18n();
  const { generateAccessToken } = useAdminTotems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  async function handleGenerate() {
    if (!totem) return;

    setIsSubmitting(true);

    try {
      const updated = await generateAccessToken(totem.id);
      setGeneratedToken(updated.accessToken);
      toast.success(t('adminTotems.messages.generateTokenSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.generateTokenError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopy() {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success(t('adminTotems.messages.tokenCopied'));
    }
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      setGeneratedToken(null);
    }
    onOpenChange(openState);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t('adminTotems.actions.generateToken')}</DialogTitle>
          <DialogDescription className="text-center">
            {generatedToken
              ? t('adminTotems.messages.tokenGeneratedWarning')
              : t('adminTotems.messages.generateTokenDescription', { name: totem?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {generatedToken && (
          <div className="space-y-2">
            <div className="bg-muted flex items-center gap-2 rounded-lg border p-3">
              <code className="flex-1 text-xs break-all">{generatedToken}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedToken ? (
            <Button onClick={() => handleClose(false)}>{t('common.actions.close')}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={handleGenerate} disabled={isSubmitting}>
                {isSubmitting ? t('common.actions.loading') : t('common.actions.confirm')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
