'use client';

import { useCallback, useState } from 'react';

import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { AdminPlanResponse } from '@/core/application/client-services/admin-plans-client.service';
import { useAdminPlans } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

import { PlanFeaturesManager } from './plan-features-manager';

export function PlansTab() {
  const { t } = useI18n();
  const {
    filteredPlans,
    categories,
    isLoadingPlans,
    searchQuery,
    filterStatus,
    filterCategory,
    setSearchQuery,
    setFilterStatus,
    setFilterCategory,
    createPlan,
    updatePlan,
    deletePlan,
  } = useAdminPlans();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminPlanResponse | null>(null);
  const [deletePlanTarget, setDeletePlanTarget] = useState<AdminPlanResponse | null>(null);
  const [featuresPlan, setFeaturesPlan] = useState<AdminPlanResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    discount: 0,
    isCustom: false,
    isActive: true,
    sortOrder: 0,
    categoryId: '' as string | null,
  });

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      description: '',
      price: 0,
      discount: 0,
      isCustom: false,
      isActive: true,
      sortOrder: 0,
      categoryId: null,
    });
  }, []);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await createPlan({
        ...form,
        categoryId: form.categoryId || null,
      });
      toast.success(t('adminPlans.messages.planCreated'));
      setCreateModalOpen(false);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.planSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [createPlan, form, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!editPlan) return;
    setIsSubmitting(true);
    try {
      await updatePlan(editPlan.id, {
        ...form,
        categoryId: form.categoryId || null,
      });
      toast.success(t('adminPlans.messages.planUpdated'));
      setEditPlan(null);
      resetForm();
    } catch {
      toast.error(t('adminPlans.messages.planSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [editPlan, updatePlan, form, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!deletePlanTarget) return;
    setIsSubmitting(true);
    try {
      await deletePlan(deletePlanTarget.id);
      toast.success(t('adminPlans.messages.planDeleted'));
      setDeletePlanTarget(null);
    } catch {
      toast.error(t('adminPlans.messages.planDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [deletePlanTarget, deletePlan, t]);

  const handleToggleStatus = useCallback(
    async (plan: AdminPlanResponse) => {
      try {
        await updatePlan(plan.id, { isActive: !plan.isActive });
        toast.success(
          plan.isActive ? t('adminPlans.messages.planDeactivated') : t('adminPlans.messages.planActivated'),
        );
      } catch {
        toast.error(t('adminPlans.messages.planToggleError'));
      }
    },
    [updatePlan, t],
  );

  const openEdit = useCallback((plan: AdminPlanResponse) => {
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      discount: plan.discount,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      categoryId: plan.categoryId,
    });
    setEditPlan(plan);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('adminPlans.filters.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.labels.all')}</SelectItem>
            <SelectItem value="active">{t('common.status.active')}</SelectItem>
            <SelectItem value="inactive">{t('common.status.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('adminPlans.filters.allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPlans.actions.newPlan')}
        </Button>
      </div>

      {/* Table */}
      {isLoadingPlans ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">{t('adminPlans.messages.noPlans')}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminPlans.fields.name')}</TableHead>
                <TableHead>{t('adminPlans.fields.category')}</TableHead>
                <TableHead>{t('adminPlans.fields.price')}</TableHead>
                <TableHead>{t('adminPlans.fields.discount')}</TableHead>
                <TableHead>{t('adminPlans.fields.features')}</TableHead>
                <TableHead>{t('adminPlans.fields.subscribers')}</TableHead>
                <TableHead>{t('common.labels.status')}</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-muted-foreground text-xs">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.category ? (
                      <Badge variant="outline" style={{ borderColor: plan.category.color, color: plan.category.color }}>
                        {plan.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>{plan.discount}%</TableCell>
                  <TableCell>{plan._count.planFeatures}</TableCell>
                  <TableCell>{plan._count.subscriptions}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? t('common.status.active') : t('common.status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFeaturesPlan(plan)}>
                          {t('adminPlans.actions.manageFeatures')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                          {plan.isActive ? t('adminPlans.actions.deactivate') : t('adminPlans.actions.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletePlanTarget(plan)}
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
        open={createModalOpen || !!editPlan}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditPlan(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPlan ? t('adminPlans.form.editTitle') : t('adminPlans.form.createTitle')}</DialogTitle>
            <DialogDescription>
              {editPlan ? t('adminPlans.form.editDescription') : t('adminPlans.form.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>{t('adminPlans.fields.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminPlans.fields.price')}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('adminPlans.fields.discount')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminPlans.fields.category')}</Label>
                <Select
                  value={form.categoryId ?? ''}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('adminPlans.fields.noCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('adminPlans.fields.noCategory')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, isActive: v }))}
                />
                <Label>{t('adminPlans.fields.active')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isCustom}
                  onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, isCustom: v }))}
                />
                <Label>{t('adminPlans.fields.custom')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditPlan(null);
                resetForm();
              }}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              onClick={editPlan ? handleUpdate : handleCreate}
              disabled={isSubmitting || !form.name || !form.description}
            >
              {isSubmitting
                ? t('common.actions.loading')
                : editPlan
                  ? t('common.actions.save')
                  : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletePlanTarget} onOpenChange={(open) => !open && setDeletePlanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPlans.messages.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('adminPlans.messages.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanTarget(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {t('common.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Features Manager */}
      <PlanFeaturesManager
        plan={featuresPlan}
        open={!!featuresPlan}
        onOpenChange={(open) => !open && setFeaturesPlan(null)}
      />
    </div>
  );
}
