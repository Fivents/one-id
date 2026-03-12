'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminOrganizations } from '@/core/application/contexts/admin-organizations-context';
import { useI18n } from '@/i18n';

export function OrganizationFilters() {
  const { t } = useI18n();
  const { searchQuery, filterStatus, setSearchQuery, setFilterStatus } = useAdminOrganizations();

  return (
    <div className="flex items-center gap-4">
      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('common.labels.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('common.labels.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.labels.all')}</SelectItem>
          <SelectItem value="active">{t('common.status.active')}</SelectItem>
          <SelectItem value="inactive">{t('common.status.inactive')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
