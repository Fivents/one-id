'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Building2, Plus } from 'lucide-react';

import {
  CreateOrganizationModal,
  DeleteOrganizationModal,
  EditOrganizationModal,
  OrganizationFilters,
  OrganizationsTable,
  ToggleStatusModal,
} from '@/components/admin/organizations';
import { Button } from '@/components/ui/button';
import {
  AdminOrganizationsProvider,
  useAdminOrganizations,
  useApp,
  useAuth,
  usePermissions,
} from '@/core/application/contexts';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { useI18n } from '@/i18n';

function AdminOrganizationsPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const { fetchOrganizations } = useAdminOrganizations();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<AdminOrganizationResponse | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<AdminOrganizationResponse | null>(null);
  const [toggleStatusOrg, setToggleStatusOrg] = useState<AdminOrganizationResponse | null>(null);

  const { t } = useI18n();

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchOrganizations();
    }
  }, [isAuthenticated, isSuperAdmin, fetchOrganizations]);

  const handleEdit = useCallback((org: AdminOrganizationResponse) => {
    setEditOrg(org);
  }, []);

  const handleDelete = useCallback((org: AdminOrganizationResponse) => {
    setDeleteOrg(org);
  }, []);

  const handleToggleStatus = useCallback((org: AdminOrganizationResponse) => {
    setToggleStatusOrg(org);
  }, []);

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('organizations.list.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('organizations.list.description')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('organizations.list.newOrg')}
        </Button>
      </div>

      <OrganizationFilters />

      <OrganizationsTable onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />

      <CreateOrganizationModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <EditOrganizationModal
        organization={editOrg}
        open={!!editOrg}
        onOpenChange={(open: boolean) => {
          if (!open) setEditOrg(null);
        }}
      />

      <DeleteOrganizationModal
        organization={deleteOrg}
        open={!!deleteOrg}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteOrg(null);
        }}
      />

      <ToggleStatusModal
        organization={toggleStatusOrg}
        open={!!toggleStatusOrg}
        onOpenChange={(open: boolean) => {
          if (!open) setToggleStatusOrg(null);
        }}
      />
    </div>
  );
}

export default function AdminOrganizationsPage() {
  return (
    <AdminOrganizationsProvider>
      <AdminOrganizationsPageContent />
    </AdminOrganizationsProvider>
  );
}
