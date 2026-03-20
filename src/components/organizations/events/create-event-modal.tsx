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
import { Textarea } from '@/components/ui/textarea';
import { useEvents } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateEventModal({ open, onOpenChange, organizationId }: CreateEventModalProps) {
  const { createEvent } = useEvents();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
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
    setDescription('');
    setTimezone('America/Sao_Paulo');
    setAddress('');
    setStartsAt('');
    setEndsAt('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !slug.trim() || !timezone.trim() || !startsAt || !endsAt) return;

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error(t('pages.organizationEvents.invalidDateError'));
      return;
    }

    if (startDate >= endDate) {
      toast.error(t('pages.organizationEvents.dateRangeError'));
      return;
    }

    setIsSubmitting(true);

    try {
      await createEvent({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        timezone: timezone.trim(),
        address: address.trim() || null,
        startsAt: startDate,
        endsAt: endDate,
        organizationId,
        status: 'DRAFT',
        printConfigId: null,
      });

      toast.success(t('pages.organizationEvents.createSuccess'));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.organizationEvents.createError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('pages.organizationEvents.createTitle')}</DialogTitle>
          <DialogDescription>{t('pages.organizationEvents.createDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">{t('common.labels.name')} *</Label>
            <Input id="event-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-slug">{t('organizations.form.slugLabel')} *</Label>
            <Input
              id="event-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">{t('common.labels.description')}</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-timezone">{t('pages.organizationEvents.timezoneLabel')} *</Label>
            <Input id="event-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-address">{t('common.labels.address')}</Label>
            <Input id="event-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-start">{t('common.labels.startDate')} *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">{t('common.labels.endDate')} *</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.labels.creating') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
