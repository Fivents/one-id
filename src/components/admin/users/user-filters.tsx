'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsers } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { useI18n } from '@/i18n';

export function UserFilters() {
  const { t } = useI18n();
  const {
    users,
    searchQuery,
    filterOrganization,
    filterStatus,
    setSearchQuery,
    setFilterOrganization,
    setFilterStatus,
  } = useAdminUsers();

  const organizations = getUniqueOrganizations(users);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('common.actions.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filterOrganization} onValueChange={setFilterOrganization}>
        <SelectTrigger className="w-full sm:w-50">
          <SelectValue placeholder={t('common.labels.organization')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.labels.all')}</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-full sm:w-45">
          <SelectValue placeholder={t('common.labels.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.labels.all')}</SelectItem>
          <SelectItem value="client">{t('users.labels.clients')}</SelectItem>
          <SelectItem value="super_admin">{t('users.labels.superAdmin')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function getUniqueOrganizations(users: AdminUserResponse[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const user of users) {
    if (user.organizationId && user.organizationName) {
      map.set(user.organizationId, user.organizationName);
    }
  }
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
