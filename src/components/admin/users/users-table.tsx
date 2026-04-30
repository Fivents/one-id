'use client';

import { Building2, Edit, KeyRound, MoreHorizontal, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminUsers } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { getNameInitials } from '@/core/utils/get-name-initials';
import { useI18n } from '@/i18n';

interface UsersTableProps {
  onEdit: (user: AdminUserResponse) => void;
  onDelete: (user: AdminUserResponse) => void;
  onResetPassword: (user: AdminUserResponse) => void;
  onManageMemberships: (user: AdminUserResponse) => void;
  onBulkDelete: (userIds: string[]) => void;
}

export function UsersTable({ onEdit, onDelete, onResetPassword, onManageMemberships, onBulkDelete }: UsersTableProps) {
  const { t } = useI18n();
  const { filteredUsers, isLoading, selectedUserIds, toggleUserSelection, toggleAllUsers } = useAdminUsers();

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('common.labels.noResults')}</p>
      </div>
    );
  }

  const selectableUsers = filteredUsers.filter((u) => !u.isSuperAdmin);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedUserIds.has(u.id));

  return (
    <div className="space-y-3">
      {selectedUserIds.size > 0 && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-2">
          <span className="text-muted-foreground text-sm">
            {t('users.bulk.selected', { count: String(selectedUserIds.size) })}
          </span>
          <Button variant="destructive" size="sm" onClick={() => onBulkDelete([...selectedUserIds])}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('users.bulk.deleteSelected')}
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
                  onChange={toggleAllUsers}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label={t('users.bulk.selectAll')}
                />
              </TableHead>
              <TableHead>{t('common.labels.name')}</TableHead>
              <TableHead>{t('common.labels.email')}</TableHead>
              <TableHead>{t('common.labels.organization')}</TableHead>
              <TableHead>{t('common.labels.status')}</TableHead>
              <TableHead>{t('common.labels.createdAt')}</TableHead>
              <TableHead className="w-17.5">{t('common.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                selected={selectedUserIds.has(user.id)}
                onToggleSelect={toggleUserSelection}
                onEdit={onEdit}
                onDelete={onDelete}
                onResetPassword={onResetPassword}
                onManageMemberships={onManageMemberships}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onResetPassword,
  onManageMemberships,
}: {
  user: AdminUserResponse;
  selected: boolean;
  onToggleSelect: (userId: string) => void;
  onEdit: (user: AdminUserResponse) => void;
  onDelete: (user: AdminUserResponse) => void;
  onResetPassword: (user: AdminUserResponse) => void;
  onManageMemberships: (user: AdminUserResponse) => void;
}) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell>
        {!user.isSuperAdmin && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(user.id)}
            className="h-4 w-4 rounded border-gray-300"
            aria-label={t('users.bulk.selectUser', { name: user.name })}
          />
        )}
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
        {user.isSuperAdmin ? (
          <Badge variant="default">{t('users.labels.superAdmin')}</Badge>
        ) : (
          <Badge variant="outline" className="bg-emerald-500 text-white">
            {t('common.status.active')}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        {!user.isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageMemberships(user)}>
                <Building2 className="mr-2 h-4 w-4" />
                {t('users.memberships.manage')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('users.labels.resetPassword')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

function UsersTableSkeleton() {
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
          {Array.from({ length: 5 }).map((_, i) => (
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
                <Skeleton className="h-5 w-16" />
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
