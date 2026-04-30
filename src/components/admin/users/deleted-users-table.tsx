'use client';

import { MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAdminUsers } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { getNameInitials } from '@/core/utils/get-name-initials';
import { useI18n } from '@/i18n';

interface DeletedUsersTableProps {
  onRestore: (user: AdminUserResponse) => void;
  onHardDelete: (user: AdminUserResponse) => void;
  onBulkHardDelete: (userIds: string[]) => void;
}

export function DeletedUsersTable({ onRestore, onHardDelete, onBulkHardDelete }: DeletedUsersTableProps) {
  const { t } = useI18n();
  const { deletedUsers, isLoadingDeleted, selectedDeletedUserIds, toggleDeletedUserSelection, toggleAllDeletedUsers } =
    useAdminUsers();

  if (isLoadingDeleted) {
    return <DeletedUsersTableSkeleton />;
  }

  if (deletedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('users.deleted.noUsers')}</p>
      </div>
    );
  }

  const allSelected = deletedUsers.length > 0 && deletedUsers.every((u) => selectedDeletedUserIds.has(u.id));

  return (
    <div className="space-y-3">
      {selectedDeletedUserIds.size > 0 && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-2">
          <span className="text-muted-foreground text-sm">
            {t('users.bulk.selected', { count: String(selectedDeletedUserIds.size) })}
          </span>
          <Button variant="destructive" size="sm" onClick={() => onBulkHardDelete([...selectedDeletedUserIds])}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('users.bulk.permanentDeleteSelected')}
          </Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAllDeletedUsers}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label={t('users.bulk.selectAll')}
                />
              </TableHead>
              <TableHead>{t('common.labels.name')}</TableHead>
              <TableHead>{t('common.labels.email')}</TableHead>
              <TableHead>{t('common.labels.organization')}</TableHead>
              <TableHead>{t('users.deleted.deletedAt')}</TableHead>
              <TableHead className="w-17.5">{t('common.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletedUsers.map((user) => (
              <DeletedUserRow
                key={user.id}
                user={user}
                selected={selectedDeletedUserIds.has(user.id)}
                onToggleSelect={toggleDeletedUserSelection}
                onRestore={onRestore}
                onHardDelete={onHardDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DeletedUserRow({
  user,
  selected,
  onToggleSelect,
  onRestore,
  onHardDelete,
}: {
  user: AdminUserResponse;
  selected: boolean;
  onToggleSelect: (userId: string) => void;
  onRestore: (user: AdminUserResponse) => void;
  onHardDelete: (user: AdminUserResponse) => void;
}) {
  const { t } = useI18n();

  return (
    <TableRow className="opacity-70">
      <TableCell>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(user.id)}
          className="h-4 w-4 rounded border-gray-300"
          aria-label={t('users.bulk.selectUser', { name: user.name })}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getNameInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        {user.organizationName ? (
          <span>{user.organizationName}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-destructive/10 text-destructive">
          {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : '—'}
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
            <DropdownMenuItem onClick={() => onRestore(user)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('users.deleted.restore')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHardDelete(user)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('users.deleted.permanentDelete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function DeletedUsersTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
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
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
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
