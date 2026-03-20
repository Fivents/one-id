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
import { useI18n } from '@/i18n';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateOrganizationModal({ open, onOpenChange }: CreateOrganizationModalProps) {
  const { t } = useI18n();
  const { createOrganization } = useAdminOrganizations();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugManuallyEdited]);

  function resetForm() {
    setName('');
    setSlug('');
    setSlugManuallyEdited(false);
    setEmail('');
    setPhone('');
    setLogoUrl('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) return;

    setIsSubmitting(true);

    try {
      const result = await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        logoUrl: logoUrl.trim() || null,
      });

      toast.success(t('organizations.messages.createSuccess', { name: result.name }));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizations.form.createError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('organizations.form.createTitle')}</DialogTitle>
          <DialogDescription>{t('organizations.form.createDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('organizations.form.name')} *</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('organizations.form.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">{t('organizations.form.slugLabel')} *</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder={t('organizations.form.slugPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-email">{t('organizations.form.email')}</Label>
            <Input
              id="org-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('organizations.form.emailPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-phone">{t('organizations.form.phone')}</Label>
            <Input
              id="org-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('organizations.form.phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-logo">{t('organizations.form.logoLabel')}</Label>
            <Input
              id="org-logo"
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
            <Button type="submit" disabled={isSubmitting || !name.trim() || !slug.trim()}>
              {isSubmitting ? t('organizations.form.creating') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
