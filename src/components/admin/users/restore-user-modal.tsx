'use client';

import { useState } from 'react';

import { RotateCcw } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsers, useOrganization } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { useI18n } from '@/i18n';

interface RestoreUserModalProps {
  user: AdminUserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestoreUserModal({ user, open, onOpenChange }: RestoreUserModalProps) {
  const { t } = useI18n();
  const { restoreUser } = useAdminUsers();
  const { organizations } = useOrganization();

  const clientOrganizations = organizations.filter((org) => org.slug !== 'fivents');

  const [role, setRole] = useState<'ORG_OWNER' | 'EVENT_MANAGER'>('ORG_OWNER');
  const [organizationId, setOrganizationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setRole('ORG_OWNER');
    setOrganizationId('');
  }

  async function handleRestore() {
    if (!user || !organizationId) return;

    setIsSubmitting(true);

    try {
      await restoreUser({
        userId: user.id,
        role,
        organizationId,
      });

      toast.success(t('users.restore.success', { name: user.name }));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.restore.error');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <RotateCcw className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t('users.restore.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('users.restore.description', { name: user?.name ?? '', email: user?.email ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.labels.organization')}</Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.form.selectOrganization')} />
              </SelectTrigger>
              <SelectContent>
                {clientOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('users.form.role')}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'ORG_OWNER' | 'EVENT_MANAGER')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORG_OWNER">{t('nav.roleLabels.ORG_OWNER')}</SelectItem>
                <SelectItem value="EVENT_MANAGER">{t('nav.roleLabels.EVENT_MANAGER')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleRestore} disabled={isSubmitting || !organizationId}>
            {isSubmitting ? t('common.actions.loading') : t('users.restore.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
