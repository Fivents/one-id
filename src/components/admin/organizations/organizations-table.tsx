'use client';

import Link from 'next/link';

import { Edit, Eye, MoreHorizontal, Power, Trash2 } from 'lucide-react';

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
import { useAdminOrganizations } from '@/core/application/contexts/admin-organizations-context';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { useI18n } from '@/i18n';

interface OrganizationsTableProps {
  onEdit: (org: AdminOrganizationResponse) => void;
  onDelete: (org: AdminOrganizationResponse) => void;
  onToggleStatus: (org: AdminOrganizationResponse) => void;
}

export function OrganizationsTable({ onEdit, onDelete, onToggleStatus }: OrganizationsTableProps) {
  const { t } = useI18n();
  const { filteredOrganizations, isLoading } = useAdminOrganizations();

  if (isLoading) {
    return <OrganizationsTableSkeleton />;
  }

  if (filteredOrganizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('organizations.list.noOrgs')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.labels.name')}</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>{t('common.labels.status')}</TableHead>
            <TableHead>{t('organizations.detail.plan')}</TableHead>
            <TableHead>{t('organizations.detail.events')}</TableHead>
            <TableHead>{t('organizations.detail.members')}</TableHead>
            <TableHead>{t('common.labels.createdAt')}</TableHead>
            <TableHead className="w-17.5">{t('common.labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrganizations.map((org) => (
            <OrganizationRow
              key={org.id}
              organization={org}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrganizationRow({
  organization,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  organization: AdminOrganizationResponse;
  onEdit: (org: AdminOrganizationResponse) => void;
  onDelete: (org: AdminOrganizationResponse) => void;
  onToggleStatus: (org: AdminOrganizationResponse) => void;
}) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell className="font-medium">{organization.name}</TableCell>
      <TableCell>
        <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{organization.slug}</code>
      </TableCell>
      <TableCell className="text-muted-foreground">{organization.email ?? '—'}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={organization.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-400/10 text-gray-500'}
        >
          {organization.isActive ? t('common.status.active') : t('common.status.inactive')}
        </Badge>
      </TableCell>
      <TableCell>
        {organization.subscription ? (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            {organization.subscription.planName}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No Plan</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{organization._count.events}</TableCell>
      <TableCell className="text-muted-foreground">{organization._count.members}</TableCell>
      <TableCell className="text-muted-foreground">{new Date(organization.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/organizations/${organization.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                {t('common.actions.viewDetails')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(organization)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(organization)}>
              <Power className="mr-2 h-4 w-4" />
              {organization.isActive ? t('users.labels.deactivate') : t('users.labels.activate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(organization)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function OrganizationsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-24" />
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
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-8" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
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
