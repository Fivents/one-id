'use client';

import { useCallback, useEffect, useState } from 'react';

import { Building2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  adminUsersClient,
  type UserMembershipResponse,
} from '@/core/application/client-services/admin-users-client.service';
import { useOrganization } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { useI18n } from '@/i18n';

interface ManageMembershipsModalProps {
  user: AdminUserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageMembershipsModal({ user, open, onOpenChange }: ManageMembershipsModalProps) {
  const { t } = useI18n();
  const { organizations } = useOrganization();

  const [memberships, setMemberships] = useState<UserMembershipResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedRole, setSelectedRole] = useState('ORG_OWNER');
  const [isAdding, setIsAdding] = useState(false);

  const clientOrganizations = organizations.filter((org) => org.slug !== 'fivents');

  const availableOrganizations = clientOrganizations.filter(
    (org) => !memberships.some((m) => m.organizationId === org.id),
  );

  const fetchMemberships = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await adminUsersClient.getUserMemberships(user.id);
      if (response.success) {
        setMemberships(response.data.memberships);
      }
    } catch {
      toast.error(t('users.memberships.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (open && user) {
      fetchMemberships();
      setSelectedOrgId('');
      setSelectedRole('ORG_OWNER');
    }
  }, [open, user, fetchMemberships]);

  async function handleAdd() {
    if (!user || !selectedOrgId) return;
    setIsAdding(true);

    try {
      const response = await adminUsersClient.addUserMembership(user.id, {
        organizationId: selectedOrgId,
        role: selectedRole,
      });

      if (response.success) {
        toast.success(t('users.memberships.addSuccess'));
        await fetchMemberships();
        setSelectedOrgId('');
      } else {
        toast.error(t('users.memberships.addError'));
      }
    } catch {
      toast.error(t('users.memberships.addError'));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(membershipId: string) {
    if (!user) return;

    if (memberships.length <= 1) {
      toast.error(t('users.memberships.cannotRemoveLast'));
      return;
    }

    try {
      const response = await adminUsersClient.removeUserMembership(user.id, membershipId);

      if (response.success) {
        toast.success(t('users.memberships.removeSuccess'));
        await fetchMemberships();
      } else {
        toast.error(t('users.memberships.removeError'));
      }
    } catch {
      toast.error(t('users.memberships.removeError'));
    }
  }

  async function handleUpdateRole(membershipId: string, newRole: string) {
    if (!user) return;

    try {
      const response = await adminUsersClient.updateMembershipRole(user.id, {
        membershipId,
        role: newRole,
      });

      if (response.success) {
        toast.success(t('users.memberships.roleUpdateSuccess'));
        await fetchMemberships();
      } else {
        toast.error(t('users.memberships.roleUpdateError'));
      }
    } catch {
      toast.error(t('users.memberships.roleUpdateError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t('users.memberships.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('users.memberships.description', { name: user?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {memberships.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.labels.organization')}</TableHead>
                      <TableHead>{t('common.labels.role')}</TableHead>
                      <TableHead className="w-12.5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.organizationName ?? m.organizationId}</TableCell>
                        <TableCell>
                          <Select value={m.role} onValueChange={(newRole) => handleUpdateRole(m.id, newRole)}>
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ORG_OWNER">{t('nav.roleLabels.ORG_OWNER')}</SelectItem>
                              <SelectItem value="EVENT_MANAGER">{t('nav.roleLabels.EVENT_MANAGER')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => handleRemove(m.id)}
                            disabled={memberships.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {availableOrganizations.length > 0 && (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.memberships.selectOrg')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-35 space-y-1">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORG_OWNER">{t('nav.roleLabels.ORG_OWNER')}</SelectItem>
                      <SelectItem value="EVENT_MANAGER">{t('nav.roleLabels.EVENT_MANAGER')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="icon" onClick={handleAdd} disabled={!selectedOrgId || isAdding}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
