'use client';

import { useState } from 'react';

import { AlertTriangle, Power } from 'lucide-react';
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
import { useAdminOrganizations } from '@/core/application/contexts/admin-organizations-context';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { useI18n } from '@/i18n';

interface ToggleStatusModalProps {
  organization: AdminOrganizationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleStatusModal({ organization, open, onOpenChange }: ToggleStatusModalProps) {
  const { t } = useI18n();
  const { toggleStatus } = useAdminOrganizations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const willActivate = organization ? !organization.isActive : false;

  async function handleConfirm() {
    if (!organization) return;

    setIsSubmitting(true);

    try {
      await toggleStatus(organization.id, willActivate);
      toast.success(
        willActivate ? t('organizations.messages.activateSuccess') : t('organizations.messages.deactivateSuccess'),
      );
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizations.messages.statusError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {willActivate ? (
              <Power className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="text-destructive h-5 w-5" />
            )}
            {willActivate ? t('users.labels.activate') : t('users.labels.deactivate')}
          </DialogTitle>
          <DialogDescription>
            {willActivate
              ? t('organizations.messages.activateConfirm', { name: organization?.name ?? '' })
              : t('organizations.messages.deactivateConfirm', { name: organization?.name ?? '' })}
          </DialogDescription>
          {!willActivate && (
            <p className="text-destructive mt-2 text-sm font-medium">{t('organizations.messages.inactiveWarning')}</p>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant={willActivate ? 'default' : 'destructive'} onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? '...' : willActivate ? t('users.labels.activate') : t('users.labels.deactivate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
