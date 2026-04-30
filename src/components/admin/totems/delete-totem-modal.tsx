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

interface DeleteTotemModalProps {
  totem: AdminTotemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTotemModal({ totem, open, onOpenChange }: DeleteTotemModalProps) {
  const { t } = useI18n();
  const { deleteTotem } = useAdminTotems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (!totem) return;

    setIsSubmitting(true);

    try {
      await deleteTotem(totem.id, { force: forceDelete });
      toast.success(t('adminTotems.messages.deleteSuccess'));
      setForceDelete(false);
      setWarningMessage(null);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.deleteError');

      if (message.includes('currently assigned to an organization')) {
        setForceDelete(true);
        setWarningMessage(
          'This totem is currently assigned to an organization. Deleting it will remove all active assignments. Do you want to continue?',
        );
      } else {
        toast.error(message);
      }
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
          <DialogTitle className="text-center">{t('common.actions.delete')}</DialogTitle>
          <DialogDescription className="text-center">
            {warningMessage ?? t('adminTotems.messages.deleteConfirmDescription', { name: totem?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('common.actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
