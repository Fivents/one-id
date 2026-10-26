'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import { useI18n } from '@/i18n';

export function TotemFilters() {
  const { t } = useI18n();
  const { searchQuery, filterStatus, setSearchQuery, setFilterStatus } = useAdminTotems();

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

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-full sm:w-56" aria-label={t('common.labels.status')}>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-muted-foreground shrink-0">{t('common.labels.status')}:</span>
            <span className="truncate">
              <SelectValue placeholder={t('common.labels.status')} />
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.labels.all')}</SelectItem>
          <SelectItem value="ACTIVE">{t('common.status.active')}</SelectItem>
          <SelectItem value="INACTIVE">{t('common.status.inactive')}</SelectItem>
          <SelectItem value="MAINTENANCE">{t('adminTotems.status.maintenance')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
