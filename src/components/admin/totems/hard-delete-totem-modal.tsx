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

interface HardDeleteTotemModalProps {
  totem: AdminTotemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HardDeleteTotemModal({ totem, open, onOpenChange }: HardDeleteTotemModalProps) {
  const { t } = useI18n();
  const { hardDeleteTotem } = useAdminTotems();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleHardDelete() {
    if (!totem) return;

    setIsSubmitting(true);

    try {
      await hardDeleteTotem(totem.id);
      toast.success(t('adminTotems.messages.hardDeleteSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.hardDeleteError');
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
          <DialogTitle className="text-center">{t('adminTotems.deleted.permanentDelete')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('adminTotems.messages.hardDeleteDescription', { name: totem?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('common.actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
