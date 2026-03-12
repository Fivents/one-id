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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminPlanCategoryResponse } from '@/core/application/client-services/admin-plans-client.service';
import { useAdminPlans } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export function CategoriesTab() {
  const { t } = useI18n();
  const { categories, isLoadingCategories, createCategory, updateCategory, deleteCategory } = useAdminPlans();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<AdminPlanCategoryResponse | null>(null);
  const [deleteCat, setDeleteCat] = useState<AdminPlanCategoryResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({ name: '', color: '#6366f1', sortOrder: 0 });

  const resetForm = useCallback(() => {
    setForm({ name: '', color: '#6366f1', sortOrder: 0 });
  }, []);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await createCategory(form);
      toast.success(t('adminPlans.messages.categoryCreated'));
      setCreateModalOpen(false);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.categorySaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [createCategory, form, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!editCat) return;
    setIsSubmitting(true);
    try {
      await updateCategory(editCat.id, form);
      toast.success(t('adminPlans.messages.categoryUpdated'));
      setEditCat(null);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.categorySaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [editCat, updateCategory, form, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteCat) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(deleteCat.id);
      toast.success(t('adminPlans.messages.categoryDeleted'));
      setDeleteCat(null);
    } catch {
      toast.error(t('adminPlans.messages.categoryDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteCat, deleteCategory, t]);

  const openEdit = useCallback((cat: AdminPlanCategoryResponse) => {
    setForm({ name: cat.name, color: cat.color, sortOrder: cat.sortOrder });
    setEditCat(cat);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{t('adminPlans.categories.description')}</p>
        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPlans.categories.newCategory')}
        </Button>
      </div>

      {isLoadingCategories ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">{t('adminPlans.categories.noCategories')}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminPlans.fields.name')}</TableHead>
                <TableHead>{t('adminPlans.fields.color')}</TableHead>
                <TableHead>{t('adminPlans.fields.sortOrder')}</TableHead>
                <TableHead>{t('adminPlans.fields.plansCount')}</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground text-xs">{cat.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat._count.plans}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(cat)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteCat(cat)}
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
        open={createModalOpen || !!editCat}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditCat(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCat ? t('adminPlans.categories.editTitle') : t('adminPlans.categories.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {editCat ? t('adminPlans.categories.editDescription') : t('adminPlans.categories.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminPlans.fields.color')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t('adminPlans.fields.sortOrder')}</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditCat(null);
                resetForm();
              }}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button onClick={editCat ? handleUpdate : handleCreate} disabled={isSubmitting || !form.name}>
              {isSubmitting
                ? t('common.actions.loading')
                : editCat
                  ? t('common.actions.save')
                  : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteCat} onOpenChange={(open) => !open && setDeleteCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPlans.categories.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('adminPlans.categories.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCat(null)}>
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
