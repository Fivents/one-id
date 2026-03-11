'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Monitor, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  CreateTotemModal,
  DeletedTotemsTable,
  DeleteTotemModal,
  EditTotemModal,
  HardDeleteTotemModal,
  RestoreTotemModal,
  TotemFilters,
  TotemsTable,
} from '@/components/admin/totems';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import { AdminTotemsProvider, useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import type { TotemStatus } from '@/core/domain/entities';
import { useI18n } from '@/i18n';

function AdminTotemsPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const {
    fetchTotems,
    fetchDeletedTotems,
    selectedIds,
    clearSelection,
    bulkSoftDelete,
    bulkHardDelete,
    generateAccessCode,
    revokeAccessCode,
    changeStatus,
  } = useAdminTotems();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTotem, setEditTotem] = useState<AdminTotemResponse | null>(null);
  const [deleteTotem, setDeleteTotem] = useState<AdminTotemResponse | null>(null);
  const [restoreTotem, setRestoreTotem] = useState<AdminTotemResponse | null>(null);
  const [hardDeleteTotem, setHardDeleteTotem] = useState<AdminTotemResponse | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkHardDeleteConfirmOpen, setBulkHardDeleteConfirmOpen] = useState(false);
  const [pendingBulkHardDeleteIds, setPendingBulkHardDeleteIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [revokeCodeTotem, setRevokeCodeTotem] = useState<AdminTotemResponse | null>(null);
  const [isRevokingCode, setIsRevokingCode] = useState(false);

  const { t } = useI18n();

  const isLoading = isAppLoading || isAuthLoading;
  const hasSelection = selectedIds.size > 0;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchTotems();
      fetchDeletedTotems();
    }
  }, [isAuthenticated, isSuperAdmin, fetchTotems, fetchDeletedTotems]);

  const handleEdit = useCallback((totem: AdminTotemResponse) => {
    setEditTotem(totem);
  }, []);

  const handleDelete = useCallback((totem: AdminTotemResponse) => {
    setDeleteTotem(totem);
  }, []);

  const handleRestore = useCallback((totem: AdminTotemResponse) => {
    setRestoreTotem(totem);
  }, []);

  const handleHardDelete = useCallback((totem: AdminTotemResponse) => {
    setHardDeleteTotem(totem);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    try {
      await bulkSoftDelete([...selectedIds]);
      clearSelection();
      fetchDeletedTotems();
      toast.success(t('adminTotems.messages.bulkDeleteSuccess', { count: String(selectedIds.size) }));
      setBulkDeleteConfirmOpen(false);
    } catch {
      toast.error(t('adminTotems.messages.deleteError'));
    } finally {
      setIsBulkDeleting(false);
    }
  }, [bulkSoftDelete, selectedIds, clearSelection, fetchDeletedTotems, t]);

  const handleBulkHardDelete = useCallback(async (totemIds: string[]) => {
    setPendingBulkHardDeleteIds(totemIds);
    setBulkHardDeleteConfirmOpen(true);
  }, []);

  const confirmBulkHardDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    try {
      await bulkHardDelete(pendingBulkHardDeleteIds);
      toast.success(
        t('adminTotems.messages.bulkHardDeleteSuccess', { count: String(pendingBulkHardDeleteIds.length) }),
      );
      setBulkHardDeleteConfirmOpen(false);
      setPendingBulkHardDeleteIds([]);
    } catch {
      toast.error(t('adminTotems.messages.hardDeleteError'));
    } finally {
      setIsBulkDeleting(false);
    }
  }, [bulkHardDelete, pendingBulkHardDeleteIds, t]);

  const handleGenerateCode = useCallback(
    async (totem: AdminTotemResponse) => {
      try {
        const updated = await generateAccessCode(totem.id);
        toast.success(t('adminTotems.messages.generateCodeSuccess', { code: updated.accessCode ?? '' }));
      } catch {
        toast.error(t('adminTotems.messages.generateCodeError'));
      }
    },
    [generateAccessCode, t],
  );

  const handleRevokeCode = useCallback((totem: AdminTotemResponse) => {
    setRevokeCodeTotem(totem);
  }, []);

  const confirmRevokeCode = useCallback(async () => {
    if (!revokeCodeTotem) return;
    setIsRevokingCode(true);
    try {
      await revokeAccessCode(revokeCodeTotem.id);
      toast.success(t('adminTotems.messages.revokeCodeSuccess'));
      setRevokeCodeTotem(null);
    } catch {
      toast.error(t('adminTotems.messages.revokeCodeError'));
    } finally {
      setIsRevokingCode(false);
    }
  }, [revokeAccessCode, revokeCodeTotem, t]);

  const handleChangeStatus = useCallback(
    async (totem: AdminTotemResponse, status: TotemStatus) => {
      try {
        await changeStatus(totem.id, status);
        toast.success(t('adminTotems.messages.changeStatusSuccess'));
      } catch {
        toast.error(t('adminTotems.messages.changeStatusError'));
      }
    },
    [changeStatus, t],
  );

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('adminTotems.list.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('adminTotems.list.description')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminTotems.list.newTotem')}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('adminTotems.tabs.active')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('adminTotems.tabs.deleted')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <TotemFilters />
          {hasSelection && (
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
              <p className="text-sm font-medium">
                {t('adminTotems.actions.selected', { count: String(selectedIds.size) })}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  {t('adminTotems.actions.clearSelection')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
                  {t('adminTotems.actions.bulkDelete')}
                </Button>
              </div>
            </div>
          )}
          <TotemsTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateCode={handleGenerateCode}
            onRevokeCode={handleRevokeCode}
            onChangeStatus={handleChangeStatus}
          />
        </TabsContent>

        <TabsContent value="deleted">
          <DeletedTotemsTable
            onRestore={handleRestore}
            onHardDelete={handleHardDelete}
            onBulkHardDelete={handleBulkHardDelete}
          />
        </TabsContent>
      </Tabs>

      <CreateTotemModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <EditTotemModal
        totem={editTotem}
        open={!!editTotem}
        onOpenChange={(open) => {
          if (!open) setEditTotem(null);
        }}
      />

      <DeleteTotemModal
        totem={deleteTotem}
        open={!!deleteTotem}
        onOpenChange={(open) => {
          if (!open) setDeleteTotem(null);
          else fetchDeletedTotems();
        }}
      />

      <RestoreTotemModal
        totem={restoreTotem}
        open={!!restoreTotem}
        onOpenChange={(open) => {
          if (!open) setRestoreTotem(null);
        }}
      />

      <HardDeleteTotemModal
        totem={hardDeleteTotem}
        open={!!hardDeleteTotem}
        onOpenChange={(open) => {
          if (!open) setHardDeleteTotem(null);
        }}
      />

      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.actions.bulkDelete')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.bulkDeleteConfirm', { count: String(selectedIds.size) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkHardDeleteConfirmOpen} onOpenChange={setBulkHardDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.deleted.bulkPermanentDelete')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.bulkHardDeleteConfirm', { count: String(pendingBulkHardDeleteIds.length) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkHardDeleteConfirmOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmBulkHardDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!revokeCodeTotem}
        onOpenChange={(open) => {
          if (!open) setRevokeCodeTotem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.actions.revokeCode')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.revokeCodeConfirm', { name: revokeCodeTotem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeCodeTotem(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmRevokeCode} disabled={isRevokingCode}>
              {isRevokingCode ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminTotemsPage() {
  return (
    <AdminTotemsProvider>
      <AdminTotemsPageContent />
    </AdminTotemsProvider>
  );
}
