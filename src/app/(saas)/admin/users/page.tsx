'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Plus, Users } from 'lucide-react';

import {
  CreateUserModal,
  DeleteUserModal,
  EditUserModal,
  ResetPasswordModal,
  UserFilters,
  UsersTable,
} from '@/components/admin/users';
import { Button } from '@/components/ui/button';
import { AdminUsersProvider, useAdminUsers, useApp, useAuth, usePermissions } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';

function AdminUsersPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const { fetchUsers } = useAdminUsers();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserResponse | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserResponse | null>(null);

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchUsers();
    }
  }, [isAuthenticated, isSuperAdmin, fetchUsers]);

  const handleEdit = useCallback((user: AdminUserResponse) => {
    setEditUser(user);
  }, []);

  const handleDelete = useCallback((user: AdminUserResponse) => {
    setDeleteUser(user);
  }, []);

  const handleResetPassword = useCallback((user: AdminUserResponse) => {
    setResetPasswordUser(user);
  }, []);

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
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground text-sm">Manage platform users and organizations.</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      <UserFilters />

      <UsersTable onEdit={handleEdit} onDelete={handleDelete} onResetPassword={handleResetPassword} />

      <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

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
        }}
      />

      <ResetPasswordModal
        user={resetPasswordUser}
        open={!!resetPasswordUser}
        onOpenChange={(open) => {
          if (!open) setResetPasswordUser(null);
        }}
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
