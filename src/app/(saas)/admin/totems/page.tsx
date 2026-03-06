'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Monitor, Plus } from 'lucide-react';

import {
  CreateTotemModal,
  DeletedTotemsTable,
  DeleteTotemModal,
  EditTotemModal,
  GenerateTokenModal,
  HardDeleteTotemModal,
  RestoreTotemModal,
  RevokeTokenModal,
  TotemFilters,
  TotemsTable,
} from '@/components/admin/totems';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import { AdminTotemsProvider, useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { useI18n } from '@/i18n';

function AdminTotemsPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const { fetchTotems, fetchDeletedTotems, selectedIds, clearSelection } = useAdminTotems();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTotem, setEditTotem] = useState<AdminTotemResponse | null>(null);
  const [deleteTotem, setDeleteTotem] = useState<AdminTotemResponse | null>(null);
  const [generateTokenTotem, setGenerateTokenTotem] = useState<AdminTotemResponse | null>(null);
  const [revokeTokenTotem, setRevokeTokenTotem] = useState<AdminTotemResponse | null>(null);
  const [restoreTotem, setRestoreTotem] = useState<AdminTotemResponse | null>(null);
  const [hardDeleteTotem, setHardDeleteTotem] = useState<AdminTotemResponse | null>(null);

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

  const handleGenerateToken = useCallback((totem: AdminTotemResponse) => {
    setGenerateTokenTotem(totem);
  }, []);

  const handleRevokeToken = useCallback((totem: AdminTotemResponse) => {
    setRevokeTokenTotem(totem);
  }, []);

  const handleRestore = useCallback((totem: AdminTotemResponse) => {
    setRestoreTotem(totem);
  }, []);

  const handleHardDelete = useCallback((totem: AdminTotemResponse) => {
    setHardDeleteTotem(totem);
  }, []);

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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement bulk delete
                    alert('Bulk delete not yet implemented');
                  }}
                >
                  {t('adminTotems.actions.bulkDelete')}
                </Button>
              </div>
            </div>
          )}
          <TotemsTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateToken={handleGenerateToken}
            onRevokeToken={handleRevokeToken}
          />
        </TabsContent>

        <TabsContent value="deleted">
          <DeletedTotemsTable onRestore={handleRestore} onHardDelete={handleHardDelete} />
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

      <GenerateTokenModal
        totem={generateTokenTotem}
        open={!!generateTokenTotem}
        onOpenChange={(open) => {
          if (!open) setGenerateTokenTotem(null);
        }}
      />

      <RevokeTokenModal
        totem={revokeTokenTotem}
        open={!!revokeTokenTotem}
        onOpenChange={(open) => {
          if (!open) setRevokeTokenTotem(null);
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
