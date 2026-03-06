'use client';

import { useState } from 'react';

import { KeyRound } from 'lucide-react';
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
import { useAdminUsers } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { useI18n } from '@/i18n';

interface ResetPasswordModalProps {
  user: AdminUserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordModal({ user, open, onOpenChange }: ResetPasswordModalProps) {
  const { t } = useI18n();
  const { resetPassword } = useAdminUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReset() {
    if (!user) return;

    setIsSubmitting(true);

    try {
      await resetPassword(user.id);
      toast.success(t('users.messages.resetPasswordSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.messages.resetPasswordError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t('users.labels.resetPassword')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('users.messages.resetPasswordDescription', { name: user?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleReset} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('users.labels.resetPassword')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
