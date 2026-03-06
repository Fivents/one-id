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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import { useI18n } from '@/i18n';

interface CreateTotemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTotemModal({ open, onOpenChange }: CreateTotemModalProps) {
  const { t } = useI18n();
  const { createTotem, bulkCreateTotems } = useAdminTotems();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk creation
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('1');

  function resetForm() {
    setName('');
    setPrice('0');
    setDiscount('0');
    setPrefix('');
    setCount('1');
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTotem({
        name,
        price: Number(price),
        discount: Number(discount),
      });

      toast.success(t('adminTotems.messages.createSuccess', { name: result.name }));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.createError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const results = await bulkCreateTotems({
        prefix,
        count: Number(count),
        price: Number(price),
        discount: Number(discount),
      });

      toast.success(t('adminTotems.messages.bulkCreateSuccess', { count: String(results.length) }));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminTotems.messages.createError');
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
          <DialogTitle>{t('adminTotems.form.createTitle')}</DialogTitle>
          <DialogDescription>{t('adminTotems.form.createDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('adminTotems.form.singleTab')}</TabsTrigger>
            <TabsTrigger value="bulk">{t('adminTotems.form.bulkTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totem-name">{t('common.labels.name')}</Label>
                <Input
                  id="totem-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('adminTotems.form.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totem-price">{t('adminTotems.columns.price')}</Label>
                <Input
                  id="totem-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totem-discount">{t('adminTotems.columns.discountPercent')}</Label>
                <Input
                  id="totem-discount"
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
                  {isSubmitting ? t('common.actions.loading') : t('common.actions.create')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk">
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totem-prefix">{t('adminTotems.form.namePrefix')}</Label>
                <Input
                  id="totem-prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder={t('adminTotems.form.namePrefixPlaceholder')}
                  required
                />
                <p className="text-muted-foreground text-xs">{t('adminTotems.form.namePrefixHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totem-count">{t('adminTotems.form.count')}</Label>
                <Input
                  id="totem-count"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  required
                />
                <p className="text-muted-foreground text-xs">{t('adminTotems.form.countHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-totem-price">{t('adminTotems.columns.price')}</Label>
                <Input
                  id="bulk-totem-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-totem-discount">{t('adminTotems.columns.discountPercent')}</Label>
                <Input
                  id="bulk-totem-discount"
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
                  {isSubmitting ? t('common.actions.loading') : t('adminTotems.form.createBulk')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
