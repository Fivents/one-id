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
import { useI18n } from '@/i18n';

interface BulkDeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  variant: 'soft' | 'hard';
  onConfirm: () => Promise<void>;
}

export function BulkDeleteConfirmModal({ open, onOpenChange, count, variant, onConfirm }: BulkDeleteConfirmModalProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.bulk.error');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = variant === 'hard' ? t('users.bulk.permanentDeleteTitle') : t('users.bulk.deleteTitle');
  const description =
    variant === 'hard'
      ? t('users.bulk.permanentDeleteDescription', { count: String(count) })
      : t('users.bulk.deleteDescription', { count: String(count) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('common.actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
