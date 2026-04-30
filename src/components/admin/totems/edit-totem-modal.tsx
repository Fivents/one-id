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
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { useI18n } from '@/i18n';

interface EditTotemModalProps {
  totem: AdminTotemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTotemModal({ totem, open, onOpenChange }: EditTotemModalProps) {
  const { t } = useI18n();
  const { updateTotem } = useAdminTotems();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (totem) {
      setName(totem.name);
      setPrice(String(totem.price));
      setDiscount(String(totem.discount));
    }
  }, [totem]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!totem) return;

    setIsSubmitting(true);

    try {
      await updateTotem(totem.id, {
        name,
        price: Number(price),
        discount: Number(discount),
      });
      toast.success(t('adminTotems.messages.updateSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.updateError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('adminTotems.form.editTitle')}</DialogTitle>
          <DialogDescription>{t('adminTotems.form.editDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-totem-name">{t('common.labels.name')}</Label>
            <Input id="edit-totem-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-totem-price">{t('adminTotems.columns.price')}</Label>
            <Input
              id="edit-totem-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-totem-discount">{t('adminTotems.columns.discount')}</Label>
            <Input
              id="edit-totem-discount"
              type="number"
              min="0"
              max="100"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.actions.loading') : t('common.actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
