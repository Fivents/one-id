'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Plus, Users } from 'lucide-react';

import {
  BulkDeleteConfirmModal,
  CreateUserModal,
  DeletedUsersTable,
  DeleteUserModal,
  EditUserModal,
  ManageMembershipsModal,
  ResetPasswordModal,
  RestoreUserModal,
  UserFilters,
  UsersTable,
} from '@/components/admin/users';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersProvider, useAdminUsers, useApp, useAuth, usePermissions } from '@/core/application/contexts';
import type { SoftDeletedUserInfo } from '@/core/application/contexts/admin-users-context';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { useI18n } from '@/i18n';

function AdminUsersPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const {
    fetchUsers,
    fetchDeletedUsers,
    bulkSoftDelete,
    bulkHardDelete,
    hardDeleteUser,
    clearUserSelection,
    clearDeletedUserSelection,
  } = useAdminUsers();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserResponse | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserResponse | null>(null);
  const [manageMembershipsUser, setManageMembershipsUser] = useState<AdminUserResponse | null>(null);
  const [restoreUser, setRestoreUser] = useState<AdminUserResponse | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<AdminUserResponse | null>(null);

  // Bulk delete state
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [bulkDeleteVariant, setBulkDeleteVariant] = useState<'soft' | 'hard'>('soft');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { t } = useI18n();

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchUsers();
      fetchDeletedUsers();
    }
  }, [isAuthenticated, isSuperAdmin, fetchUsers, fetchDeletedUsers]);

  const handleEdit = useCallback((user: AdminUserResponse) => {
    setEditUser(user);
  }, []);

  const handleDelete = useCallback((user: AdminUserResponse) => {
    setDeleteUser(user);
  }, []);

  const handleResetPassword = useCallback((user: AdminUserResponse) => {
    setResetPasswordUser(user);
  }, []);

  const handleManageMemberships = useCallback((user: AdminUserResponse) => {
    setManageMembershipsUser(user);
  }, []);

  const handleBulkDelete = useCallback((userIds: string[]) => {
    setBulkDeleteIds(userIds);
    setBulkDeleteVariant('soft');
    setBulkDeleteOpen(true);
  }, []);

  const handleBulkHardDelete = useCallback((userIds: string[]) => {
    setBulkDeleteIds(userIds);
    setBulkDeleteVariant('hard');
    setBulkDeleteOpen(true);
  }, []);

  const handleRestore = useCallback((user: AdminUserResponse) => {
    setRestoreUser(user);
  }, []);

  const handleHardDelete = useCallback((user: AdminUserResponse) => {
    setHardDeleteTarget(user);
  }, []);

  const handleSoftDeletedDetected = useCallback((info: SoftDeletedUserInfo) => {
    setRestoreUser({
      id: info.id,
      name: info.name,
      email: info.email,
      avatarUrl: null,
      organizationId: null,
      organizationName: null,
      role: null,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }, []);

  const handleBulkConfirm = useCallback(async () => {
    if (bulkDeleteVariant === 'soft') {
      await bulkSoftDelete(bulkDeleteIds);
      clearUserSelection();
      fetchDeletedUsers();
    } else {
      await bulkHardDelete(bulkDeleteIds);
      clearDeletedUserSelection();
    }
  }, [
    bulkDeleteVariant,
    bulkDeleteIds,
    bulkSoftDelete,
    bulkHardDelete,
    clearUserSelection,
    clearDeletedUserSelection,
    fetchDeletedUsers,
  ]);

  const handleHardDeleteConfirm = useCallback(async () => {
    if (!hardDeleteTarget) return;
    await hardDeleteUser(hardDeleteTarget.id);
    setHardDeleteTarget(null);
  }, [hardDeleteTarget, hardDeleteUser]);

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Users className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('users.list.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('users.list.description')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('users.list.newUser')}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('users.tabs.active')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('users.tabs.deleted')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <UserFilters />
          <UsersTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResetPassword={handleResetPassword}
            onManageMemberships={handleManageMemberships}
            onBulkDelete={handleBulkDelete}
          />
        </TabsContent>

        <TabsContent value="deleted">
          <DeletedUsersTable
            onRestore={handleRestore}
            onHardDelete={handleHardDelete}
            onBulkHardDelete={handleBulkHardDelete}
          />
        </TabsContent>
      </Tabs>

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSoftDeletedDetected={handleSoftDeletedDetected}
      />

      <EditUserModal
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      />

      <DeleteUserModal
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => {
          if (!open) setDeleteUser(null);
          else fetchDeletedUsers();
        }}
      />

      <ResetPasswordModal
        user={resetPasswordUser}
        open={!!resetPasswordUser}
        onOpenChange={(open) => {
          if (!open) setResetPasswordUser(null);
        }}
      />

      <ManageMembershipsModal
        user={manageMembershipsUser}
        open={!!manageMembershipsUser}
        onOpenChange={(open) => {
          if (!open) setManageMembershipsUser(null);
        }}
      />

      <RestoreUserModal
        user={restoreUser}
        open={!!restoreUser}
        onOpenChange={(open) => {
          if (!open) setRestoreUser(null);
        }}
      />

      <BulkDeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={bulkDeleteIds.length}
        variant={bulkDeleteVariant}
        onConfirm={handleBulkConfirm}
      />

      {/* Hard delete single user confirmation - reuse BulkDeleteConfirmModal with count=1 */}
      <BulkDeleteConfirmModal
        open={!!hardDeleteTarget}
        onOpenChange={(open) => {
          if (!open) setHardDeleteTarget(null);
        }}
        count={1}
        variant="hard"
        onConfirm={handleHardDeleteConfirm}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminUsersProvider>
      <AdminUsersPageContent />
    </AdminUsersProvider>
  );
}
