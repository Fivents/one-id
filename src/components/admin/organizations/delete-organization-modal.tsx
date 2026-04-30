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
import { useAdminOrganizations } from '@/core/application/contexts/admin-organizations-context';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { useI18n } from '@/i18n';

interface DeleteOrganizationModalProps {
  organization: AdminOrganizationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationModal({ organization, open, onOpenChange }: DeleteOrganizationModalProps) {
  const { t } = useI18n();
  const { deleteOrganization } = useAdminOrganizations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    if (!organization) return;

    setIsSubmitting(true);

    try {
      await deleteOrganization(organization.id);
      toast.success(t('organizations.messages.deleteSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizations.messages.deleteError');
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
            <AlertTriangle className="text-destructive h-5 w-5" />
            {t('common.actions.delete')}
          </DialogTitle>
          <DialogDescription>
            {t('organizations.messages.deleteConfirmDescription', { name: organization?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? t('common.labels.deleting') : t('common.actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
