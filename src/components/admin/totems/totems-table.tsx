'use client';

import { Edit, Key, KeyRound, MoreHorizontal, Settings, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import type { TotemStatus } from '@/core/domain/entities';
import { useI18n } from '@/i18n';

interface TotemsTableProps {
  onEdit: (totem: AdminTotemResponse) => void;
  onDelete: (totem: AdminTotemResponse) => void;
  onGenerateCode: (totem: AdminTotemResponse) => void;
  onRevokeCode: (totem: AdminTotemResponse) => void;
  onChangeStatus: (totem: AdminTotemResponse, status: TotemStatus) => void;
  onAssignToOrganization: (totem: AdminTotemResponse) => void;
  onUnassignFromOrganization: (totem: AdminTotemResponse) => void;
  onViewAssignments: (totem: AdminTotemResponse) => void;
}

export function TotemsTable({
  onEdit,
  onDelete,
  onGenerateCode,
  onRevokeCode,
  onChangeStatus,
  onAssignToOrganization,
  onUnassignFromOrganization,
  onViewAssignments,
}: TotemsTableProps) {
  const { t } = useI18n();
  const { filteredTotems, isLoading, selectedIds, toggleSelection, selectAll, clearSelection } = useAdminTotems();

  const allSelected = filteredTotems.length > 0 && filteredTotems.every((t) => selectedIds.has(t.id));
  // const someSelected = filteredTotems.some((t) => selectedIds.has(t.id)) && !allSelected;

  function handleSelectAll() {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }

  if (isLoading) {
    return <TotemsTableSkeleton />;
  }

  if (filteredTotems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('common.labels.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label={t('adminTotems.actions.selectAll')}
              />
            </TableHead>
            <TableHead>{t('common.labels.name')}</TableHead>
            <TableHead>{t('adminTotems.columns.accessCode')}</TableHead>
            <TableHead>{t('common.labels.status')}</TableHead>
            <TableHead>{t('pages.adminTotemsTable.organization')}</TableHead>
            <TableHead>{t('pages.adminTotemsTable.event')}</TableHead>
            <TableHead>{t('adminTotems.columns.price')}</TableHead>
            <TableHead>{t('adminTotems.columns.discount')}</TableHead>
            <TableHead>{t('common.labels.createdAt')}</TableHead>
            <TableHead className="w-17.5">{t('common.labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTotems.map((totem) => (
            <TotemRow
              key={totem.id}
              totem={totem}
              selected={selectedIds.has(totem.id)}
              onToggleSelection={() => toggleSelection(totem.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onGenerateCode={onGenerateCode}
              onRevokeCode={onRevokeCode}
              onChangeStatus={onChangeStatus}
              onAssignToOrganization={onAssignToOrganization}
              onUnassignFromOrganization={onUnassignFromOrganization}
              onViewAssignments={onViewAssignments}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TotemRow({
  totem,
  selected,
  onToggleSelection,
  onEdit,
  onDelete,
  onGenerateCode,
  onRevokeCode,
  onChangeStatus,
  onAssignToOrganization,
  onUnassignFromOrganization,
  onViewAssignments,
}: {
  totem: AdminTotemResponse;
  selected: boolean;
  onToggleSelection: () => void;
  onEdit: (totem: AdminTotemResponse) => void;
  onDelete: (totem: AdminTotemResponse) => void;
  onGenerateCode: (totem: AdminTotemResponse) => void;
  onRevokeCode: (totem: AdminTotemResponse) => void;
  onChangeStatus: (totem: AdminTotemResponse, status: TotemStatus) => void;
  onAssignToOrganization: (totem: AdminTotemResponse) => void;
  onUnassignFromOrganization: (totem: AdminTotemResponse) => void;
  onViewAssignments: (totem: AdminTotemResponse) => void;
}) {
  const { t, locale } = useI18n();

  // Status badge based on session (online/offline) or manual maintenance
  const isOnline = totem.hasActiveSession;
  const statusVariant = {
    ACTIVE: isOnline ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white',
    INACTIVE: 'bg-gray-400 text-white',
    MAINTENANCE: 'bg-yellow-500 text-white',
  }[totem.status];

  const statusLabel = {
    ACTIVE: isOnline ? t('adminTotems.columns.online') : t('adminTotems.columns.offline'),
    INACTIVE: t('common.status.inactive'),
    MAINTENANCE: t('adminTotems.status.maintenance'),
  }[totem.status];

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onToggleSelection} />
      </TableCell>
      <TableCell className="font-medium">{totem.name}</TableCell>
      <TableCell>
        {totem.accessCode ? (
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{totem.accessCode}</code>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusVariant}>
          {statusLabel}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {totem.currentSubscription?.organizationName ?? t('pages.adminTotemsTable.notAssigned')}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {totem.currentEvent?.eventName ?? t('pages.adminTotemsTable.noEvent')}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(totem.price)}
      </TableCell>
      <TableCell className="text-muted-foreground">{totem.discount}%</TableCell>
      <TableCell className="text-muted-foreground">
        {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(totem.createdAt))}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(totem)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAssignToOrganization(totem)}>
              {t('pages.adminTotemsTable.assignToOrganization')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUnassignFromOrganization(totem)} disabled={!totem.currentSubscription}>
              {t('pages.adminTotemsTable.unassignFromOrganization')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewAssignments(totem)}>
              {t('pages.adminTotemsTable.viewAssignments')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {totem.accessCode ? (
              <DropdownMenuItem onClick={() => onRevokeCode(totem)}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('adminTotems.actions.revokeCode')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onGenerateCode(totem)}>
                <Key className="mr-2 h-4 w-4" />
                {t('adminTotems.actions.generateCode')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Settings className="mr-2 h-4 w-4" />
                {t('adminTotems.actions.changeStatus')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {totem.status !== 'INACTIVE' && (
                  <DropdownMenuItem onClick={() => onChangeStatus(totem, 'INACTIVE')}>
                    {t('common.status.inactive')}
                  </DropdownMenuItem>
                )}
                {totem.status !== 'MAINTENANCE' && (
                  <DropdownMenuItem onClick={() => onChangeStatus(totem, 'MAINTENANCE')}>
                    {t('adminTotems.status.maintenance')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(totem)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function TotemsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-10" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
