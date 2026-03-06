'use client';

import { useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsers, UserSoftDeletedClientError } from '@/core/application/contexts';
import { useOrganization } from '@/core/application/contexts';
import type { SoftDeletedUserInfo } from '@/core/application/contexts/admin-users-context';
import { useI18n } from '@/i18n';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSoftDeletedDetected?: (user: SoftDeletedUserInfo) => void;
}

export function CreateUserModal({ open, onOpenChange, onSoftDeletedDetected }: CreateUserModalProps) {
  const { t } = useI18n();
  const { createUser } = useAdminUsers();
  const { organizations } = useOrganization();

  const clientOrganizations = organizations.filter((org) => org.slug !== 'fivents');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ORG_OWNER');
  const [organizationId, setOrganizationId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasOrganizations = clientOrganizations.length > 0;

  function resetForm() {
    setName('');
    setEmail('');
    setRole('ORG_OWNER');
    setOrganizationId('');
    setNewOrgName('');
    setIsCreatingOrg(false);
  }

  const isOrgValid = isCreatingOrg || !hasOrganizations ? !!newOrgName.trim() : !!organizationId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createUser({
        name,
        email,
        role: role as 'ORG_OWNER' | 'EVENT_MANAGER',
        organizationId: isCreatingOrg || !hasOrganizations ? undefined : organizationId || undefined,
        organizationName: isCreatingOrg || !hasOrganizations ? newOrgName || undefined : undefined,
      });

      toast.success(t('users.messages.createSuccess', { name: result.user.name }));

      resetForm();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof UserSoftDeletedClientError && onSoftDeletedDetected) {
        onSoftDeletedDetected(error.softDeletedUser);
        onOpenChange(false);
        return;
      }

      const message = error instanceof Error ? error.message : t('users.messages.createError');
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
          <DialogTitle>{t('users.form.createTitle')}</DialogTitle>
          <DialogDescription>{t('users.form.createDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('common.labels.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('common.labels.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('users.form.role')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORG_OWNER">{t('nav.roleLabels.ORG_OWNER')}</SelectItem>
                <SelectItem value="EVENT_MANAGER">{t('nav.roleLabels.EVENT_MANAGER')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasOrganizations && !isCreatingOrg ? (
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
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setIsCreatingOrg(true)}
              >
                {t('users.form.createNewOrg')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="orgName">{t('users.form.organizationName')}</Label>
              <Input
                id="orgName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
              {hasOrganizations && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setIsCreatingOrg(false)}
                >
                  {t('users.form.selectExistingOrg')}
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isOrgValid}>
              {isSubmitting ? t('common.actions.loading') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
