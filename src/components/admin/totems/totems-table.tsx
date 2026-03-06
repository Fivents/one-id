'use client';

import { Edit, Key, KeyRound, MoreHorizontal, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { useI18n } from '@/i18n';

interface TotemsTableProps {
  onEdit: (totem: AdminTotemResponse) => void;
  onDelete: (totem: AdminTotemResponse) => void;
  onGenerateToken: (totem: AdminTotemResponse) => void;
  onRevokeToken: (totem: AdminTotemResponse) => void;
}

export function TotemsTable({ onEdit, onDelete, onGenerateToken, onRevokeToken }: TotemsTableProps) {
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
            <TableHead>{t('common.labels.status')}</TableHead>
            <TableHead>{t('adminTotems.columns.subscription')}</TableHead>
            <TableHead>{t('adminTotems.columns.price')}</TableHead>
            <TableHead>{t('adminTotems.columns.discount')}</TableHead>
            <TableHead>{t('adminTotems.columns.accessToken')}</TableHead>
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
              onGenerateToken={onGenerateToken}
              onRevokeToken={onRevokeToken}
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
  onGenerateToken,
  onRevokeToken,
}: {
  totem: AdminTotemResponse;
  selected: boolean;
  onToggleSelection: () => void;
  onEdit: (totem: AdminTotemResponse) => void;
  onDelete: (totem: AdminTotemResponse) => void;
  onGenerateToken: (totem: AdminTotemResponse) => void;
  onRevokeToken: (totem: AdminTotemResponse) => void;
}) {
  const { t } = useI18n();

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
        <Badge variant="outline" className={statusVariant}>
          {statusLabel}
        </Badge>
      </TableCell>
      <TableCell>
        {totem.currentSubscription ? (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            {t('adminTotems.columns.inUseBy', { org: totem.currentSubscription.organizationName })}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            {t('adminTotems.columns.available')}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {totem.price.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}
      </TableCell>
      <TableCell className="text-muted-foreground">{totem.discount}%</TableCell>
      <TableCell>
        {totem.accessToken ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
            <Key className="mr-1 h-3 w-3" />
            {t('adminTotems.columns.hasToken')}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(totem.createdAt).toLocaleDateString()}</TableCell>
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
            {totem.accessToken ? (
              <DropdownMenuItem onClick={() => onRevokeToken(totem)}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('adminTotems.actions.revokeToken')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onGenerateToken(totem)}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('adminTotems.actions.generateToken')}
              </DropdownMenuItem>
            )}
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
