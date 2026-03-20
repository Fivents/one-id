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
import type { EventSummaryResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';

interface EditEventModalProps {
  event: EventSummaryResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventModal({ event, open, onOpenChange }: EditEventModalProps) {
  const { updateEvent } = useEvents();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDescription(event.description ?? '');
      setTimezone(event.timezone);
      setAddress(event.address ?? '');
      setStartsAt(new Date(event.startsAt).toISOString().slice(0, 16));
      setEndsAt(new Date(event.endsAt).toISOString().slice(0, 16));
    }
  }, [event]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!event || !name.trim() || !timezone.trim() || !startsAt || !endsAt) return;

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
      await updateEvent(event.id, {
        name: name.trim(),
        description: description.trim() || null,
        timezone: timezone.trim(),
        address: address.trim() || null,
        startsAt: startDate,
        endsAt: endDate,
      });

      toast.success(t('pages.organizationEvents.updateSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.organizationEvents.updateError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('pages.organizationEvents.editTitle')}</DialogTitle>
          <DialogDescription>{t('pages.organizationEvents.editDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-event-name">{t('common.labels.name')} *</Label>
            <Input id="edit-event-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={event?.slug ?? ''} disabled className="bg-muted" />
            <p className="text-muted-foreground text-xs">{t('organizations.form.slugImmutableHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-description">{t('common.labels.description')}</Label>
            <Textarea
              id="edit-event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-timezone">{t('pages.organizationEvents.timezoneLabel')} *</Label>
            <Input id="edit-event-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-address">{t('common.labels.address')}</Label>
            <Input id="edit-event-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-event-start">{t('common.labels.startDate')} *</Label>
              <Input
                id="edit-event-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-end">{t('common.labels.endDate')} *</Label>
              <Input
                id="edit-event-end"
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
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? t('common.labels.saving') : t('common.actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
