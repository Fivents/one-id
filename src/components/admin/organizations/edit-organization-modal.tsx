'use client';

import { useEffect, useState } from 'react';

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
import { useAdminOrganizations } from '@/core/application/contexts/admin-organizations-context';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { useI18n } from '@/i18n';

interface EditOrganizationModalProps {
  organization: AdminOrganizationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrganizationModal({ organization, open, onOpenChange }: EditOrganizationModalProps) {
  const { t } = useI18n();
  const { updateOrganization } = useAdminOrganizations();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setEmail(organization.email ?? '');
      setPhone(organization.phone ?? '');
      setLogoUrl(organization.logoUrl ?? '');
    }
  }, [organization]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization || !name.trim()) return;

    setIsSubmitting(true);

    try {
      await updateOrganization(organization.id, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        logoUrl: logoUrl.trim() || null,
      });

      toast.success(t('organizations.messages.updateSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizations.messages.updateError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('organizations.form.editTitle')}</DialogTitle>
          <DialogDescription>{t('organizations.form.editDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-org-name">{t('organizations.form.name')} *</Label>
            <Input
              id="edit-org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('organizations.form.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('organizations.form.slugLabel')}</Label>
            <Input value={organization?.slug ?? ''} disabled className="bg-muted" />
            <p className="text-muted-foreground text-xs">{t('organizations.form.slugImmutableHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-org-email">{t('organizations.form.email')}</Label>
            <Input
              id="edit-org-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('organizations.form.emailPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-org-phone">{t('organizations.form.phone')}</Label>
            <Input
              id="edit-org-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('organizations.form.phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-org-logo">{t('organizations.form.logoLabel')}</Label>
            <Input
              id="edit-org-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={t('organizations.form.logoPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? t('common.labels.saving') : t('common.actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
