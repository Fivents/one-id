'use client';

import { MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { useI18n } from '@/i18n';

interface DeletedTotemsTableProps {
  onRestore: (totem: AdminTotemResponse) => void;
  onHardDelete: (totem: AdminTotemResponse) => void;
}

export function DeletedTotemsTable({ onRestore, onHardDelete }: DeletedTotemsTableProps) {
  const { t } = useI18n();
  const { deletedTotems, isLoadingDeleted } = useAdminTotems();

  if (isLoadingDeleted) {
    return <DeletedTotemsTableSkeleton />;
  }

  if (deletedTotems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('adminTotems.deleted.noTotems')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.labels.name')}</TableHead>
            <TableHead>{t('adminTotems.columns.price')}</TableHead>
            <TableHead>{t('adminTotems.deleted.deletedAt')}</TableHead>
            <TableHead className="w-17.5">{t('common.labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedTotems.map((totem) => (
            <DeletedTotemRow key={totem.id} totem={totem} onRestore={onRestore} onHardDelete={onHardDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DeletedTotemRow({
  totem,
  onRestore,
  onHardDelete,
}: {
  totem: AdminTotemResponse;
  onRestore: (totem: AdminTotemResponse) => void;
  onHardDelete: (totem: AdminTotemResponse) => void;
}) {
  const { t } = useI18n();

  return (
    <TableRow className="opacity-70">
      <TableCell className="font-medium">{totem.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {totem.price.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-destructive/10 text-destructive">
          {totem.deletedAt ? new Date(totem.deletedAt).toLocaleDateString() : '—'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRestore(totem)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('adminTotems.deleted.restore')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHardDelete(totem)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('adminTotems.deleted.permanentDelete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function DeletedTotemsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <Skeleton className="h-4 w-10" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
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
