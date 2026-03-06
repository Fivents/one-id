'use client';

import { useState } from 'react';

import { AlertTriangle } from 'lucide-react';
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

interface RevokeTokenModalProps {
  totem: AdminTotemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevokeTokenModal({ totem, open, onOpenChange }: RevokeTokenModalProps) {
  const { t } = useI18n();
  const { revokeAccessToken } = useAdminTotems();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRevoke() {
    if (!totem) return;

    setIsSubmitting(true);

    try {
      await revokeAccessToken(totem.id);
      toast.success(t('adminTotems.messages.revokeTokenSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.revokeTokenError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t('adminTotems.actions.revokeToken')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('adminTotems.messages.revokeTokenDescription', { name: totem?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('common.actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
