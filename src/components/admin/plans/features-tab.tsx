'use client';

import { useCallback, useState } from 'react';

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { AdminFeatureResponse } from '@/core/application/client-services/admin-plans-client.service';
import { useAdminPlans } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export function FeaturesTab() {
  const { t } = useI18n();
  const { features, isLoadingFeatures, createFeature, updateFeature, deleteFeature } = useAdminPlans();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editFeat, setEditFeat] = useState<AdminFeatureResponse | null>(null);
  const [deleteFeat, setDeleteFeat] = useState<AdminFeatureResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'boolean' as 'boolean' | 'number' | 'string',
    description: '',
  });

  const resetForm = useCallback(() => {
    setForm({ code: '', name: '', type: 'boolean', description: '' });
  }, []);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await createFeature({
        ...form,
        description: form.description || undefined,
      });
      toast.success(t('adminPlans.messages.featureCreated'));
      setCreateModalOpen(false);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.featureSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [createFeature, form, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!editFeat) return;
    setIsSubmitting(true);
    try {
      await updateFeature(editFeat.id, {
        name: form.name,
        type: form.type,
        description: form.description || undefined,
      });
      toast.success(t('adminPlans.messages.featureUpdated'));
      setEditFeat(null);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.featureSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [editFeat, updateFeature, form, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteFeat) return;
    setIsSubmitting(true);
    try {
      await deleteFeature(deleteFeat.id);
      toast.success(t('adminPlans.messages.featureDeleted'));
      setDeleteFeat(null);
    } catch {
      toast.error(t('adminPlans.messages.featureDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteFeat, deleteFeature, t]);

  const openEdit = useCallback((feat: AdminFeatureResponse) => {
    setForm({
      code: feat.code,
      name: feat.name,
      type: feat.type as 'boolean' | 'number' | 'string',
      description: feat.description ?? '',
    });
    setEditFeat(feat);
  }, []);

  const typeColors: Record<string, string> = {
    boolean: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    number: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    string: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{t('adminPlans.features.description')}</p>
        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPlans.features.newFeature')}
        </Button>
      </div>

      {isLoadingFeatures ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : features.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">{t('adminPlans.features.noFeatures')}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminPlans.fields.code')}</TableHead>
                <TableHead>{t('adminPlans.fields.name')}</TableHead>
                <TableHead>{t('adminPlans.fields.type')}</TableHead>
                <TableHead>{t('adminPlans.fields.description')}</TableHead>
                <TableHead>{t('adminPlans.fields.usedInPlans')}</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feat) => (
                <TableRow key={feat.id}>
                  <TableCell>
                    <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{feat.code}</code>
                  </TableCell>
                  <TableCell className="font-medium">{feat.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[feat.type] ?? ''}`}
                    >
                      {feat.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{feat.description || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{feat._count.planFeatures}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(feat)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteFeat(feat)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={createModalOpen || !!editFeat}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditFeat(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editFeat ? t('adminPlans.features.editTitle') : t('adminPlans.features.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {editFeat ? t('adminPlans.features.editDescription') : t('adminPlans.features.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.code')}</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                disabled={!!editFeat}
                placeholder="max_events"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('adminPlans.features.namePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.type')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditFeat(null);
                resetForm();
              }}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              onClick={editFeat ? handleUpdate : handleCreate}
              disabled={isSubmitting || !form.name || (!editFeat && !form.code)}
            >
              {isSubmitting
                ? t('common.actions.loading')
                : editFeat
                  ? t('common.actions.save')
                  : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteFeat} onOpenChange={(open) => !open && setDeleteFeat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPlans.features.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('adminPlans.features.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFeat(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {t('common.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
