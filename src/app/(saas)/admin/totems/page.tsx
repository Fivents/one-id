'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChevronLeft, ChevronRight, Monitor, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  CreateTotemModal,
  DeletedTotemsTable,
  DeleteTotemModal,
  EditTotemModal,
  HardDeleteTotemModal,
  RestoreTotemModal,
  TotemFilters,
  TotemsTable,
} from '@/components/admin/totems';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  adminTotemsClient,
  organizationsClient,
  type TotemAssignmentHistory,
} from '@/core/application/client-services';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import { AdminTotemsProvider, useAdminTotems } from '@/core/application/contexts/admin-totems-context';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import type { OrganizationResponse } from '@/core/communication/responses/organization';
import type { TotemStatus } from '@/core/domain/entities';
import { useI18n } from '@/i18n';

function toDateTimeLocalValue(value: Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatRelativeDiff(targetDate: Date | string, locale: string) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absMs < 60_000) {
    const seconds = Math.round(diffMs / 1000);
    return rtf.format(seconds, 'second');
  }

  if (absMs < 3_600_000) {
    const minutes = Math.round(diffMs / 60_000);
    return rtf.format(minutes, 'minute');
  }

  if (absMs < 86_400_000) {
    const hours = Math.round(diffMs / 3_600_000);
    return rtf.format(hours, 'hour');
  }

  const days = Math.round(diffMs / 86_400_000);
  return rtf.format(days, 'day');
}

const ASSIGNMENTS_PER_PAGE = 6;

function AdminTotemsPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const {
    fetchTotems,
    fetchDeletedTotems,
    selectedIds,
    clearSelection,
    bulkSoftDelete,
    bulkHardDelete,
    generateAccessCode,
    revokeAccessCode,
    changeStatus,
  } = useAdminTotems();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTotem, setEditTotem] = useState<AdminTotemResponse | null>(null);
  const [deleteTotem, setDeleteTotem] = useState<AdminTotemResponse | null>(null);
  const [restoreTotem, setRestoreTotem] = useState<AdminTotemResponse | null>(null);
  const [hardDeleteTotem, setHardDeleteTotem] = useState<AdminTotemResponse | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkHardDeleteConfirmOpen, setBulkHardDeleteConfirmOpen] = useState(false);
  const [pendingBulkHardDeleteIds, setPendingBulkHardDeleteIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [revokeCodeTotem, setRevokeCodeTotem] = useState<AdminTotemResponse | null>(null);
  const [isRevokingCode, setIsRevokingCode] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
  const [assignOrgTotem, setAssignOrgTotem] = useState<AdminTotemResponse | null>(null);
  const [assignOrganizationId, setAssignOrganizationId] = useState('');
  const [assignStartsAt, setAssignStartsAt] = useState('');
  const [assignEndsAt, setAssignEndsAt] = useState('');
  const [isAssigningOrg, setIsAssigningOrg] = useState(false);
  const [assignmentsTotem, setAssignmentsTotem] = useState<AdminTotemResponse | null>(null);
  const [assignments, setAssignments] = useState<TotemAssignmentHistory[]>([]);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const { t, locale } = useI18n();
  const confirm = useConfirm();

  const isLoading = isAppLoading || isAuthLoading;
  const hasSelection = selectedIds.size > 0;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchTotems();
      fetchDeletedTotems();
      void organizationsClient.listOrganizations().then((response) => {
        if (response.success) {
          setOrganizations(response.data);
        }
      });
    }
  }, [isAuthenticated, isSuperAdmin, fetchTotems, fetchDeletedTotems]);

  const handleEdit = useCallback((totem: AdminTotemResponse) => {
    setEditTotem(totem);
  }, []);

  const handleDelete = useCallback((totem: AdminTotemResponse) => {
    setDeleteTotem(totem);
  }, []);

  const handleRestore = useCallback((totem: AdminTotemResponse) => {
    setRestoreTotem(totem);
  }, []);

  const handleHardDelete = useCallback((totem: AdminTotemResponse) => {
    setHardDeleteTotem(totem);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    try {
      await bulkSoftDelete([...selectedIds]);
      clearSelection();
      fetchDeletedTotems();
      toast.success(t('adminTotems.messages.bulkDeleteSuccess', { count: String(selectedIds.size) }));
      setBulkDeleteConfirmOpen(false);
    } catch {
      toast.error(t('adminTotems.messages.deleteError'));
    } finally {
      setIsBulkDeleting(false);
    }
  }, [bulkSoftDelete, selectedIds, clearSelection, fetchDeletedTotems, t]);

  const handleBulkHardDelete = useCallback(async (totemIds: string[]) => {
    setPendingBulkHardDeleteIds(totemIds);
    setBulkHardDeleteConfirmOpen(true);
  }, []);

  const confirmBulkHardDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    try {
      await bulkHardDelete(pendingBulkHardDeleteIds);
      toast.success(
        t('adminTotems.messages.bulkHardDeleteSuccess', { count: String(pendingBulkHardDeleteIds.length) }),
      );
      setBulkHardDeleteConfirmOpen(false);
      setPendingBulkHardDeleteIds([]);
    } catch {
      toast.error(t('adminTotems.messages.hardDeleteError'));
    } finally {
      setIsBulkDeleting(false);
    }
  }, [bulkHardDelete, pendingBulkHardDeleteIds, t]);

  const handleGenerateCode = useCallback(
    async (totem: AdminTotemResponse) => {
      try {
        const updated = await generateAccessCode(totem.id);
        toast.success(t('adminTotems.messages.generateCodeSuccess', { code: updated.accessCode ?? '' }));
      } catch {
        toast.error(t('adminTotems.messages.generateCodeError'));
      }
    },
    [generateAccessCode, t],
  );

  const handleRevokeCode = useCallback((totem: AdminTotemResponse) => {
    setRevokeCodeTotem(totem);
  }, []);

  const confirmRevokeCode = useCallback(async () => {
    if (!revokeCodeTotem) return;
    setIsRevokingCode(true);
    try {
      await revokeAccessCode(revokeCodeTotem.id);
      toast.success(t('adminTotems.messages.revokeCodeSuccess'));
      setRevokeCodeTotem(null);
    } catch {
      toast.error(t('adminTotems.messages.revokeCodeError'));
    } finally {
      setIsRevokingCode(false);
    }
  }, [revokeAccessCode, revokeCodeTotem, t]);

  const handleChangeStatus = useCallback(
    async (totem: AdminTotemResponse, status: TotemStatus) => {
      try {
        await changeStatus(totem.id, status);
        toast.success(t('adminTotems.messages.changeStatusSuccess'));
      } catch {
        toast.error(t('adminTotems.messages.changeStatusError'));
      }
    },
    [changeStatus, t],
  );

  const handleAssignToOrganization = useCallback((totem: AdminTotemResponse) => {
    setAssignOrgTotem(totem);
    setAssignOrganizationId('');
    setAssignStartsAt(toDateTimeLocalValue(new Date()));
    setAssignEndsAt(toDateTimeLocalValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  }, []);

  const handleUnassignFromOrganization = useCallback(
    async (totem: AdminTotemResponse) => {
      const accepted = await confirm.confirm({
        title: t('pages.adminTotemsPage.unassignOrgTitle'),
        description: t('pages.adminTotemsPage.unassignOrgDescription').replace('{name}', totem.name),
        confirmLabel: t('pages.adminTotemsPage.unassignOrgConfirm'),
        variant: 'destructive',
      });

      if (!accepted) return;

      try {
        const response = await adminTotemsClient.unassignTotemFromOrganization(totem.id);
        if (!response.success) {
          throw new Error(response.error.message);
        }

        await fetchTotems();
        toast.success(t('pages.adminTotemsPage.removeOrgSuccess'));
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.adminTotemsPage.removeOrgError');
        toast.error(message);
      }
    },
    [
      confirm,
      fetchTotems,
      t('pages.adminTotemsPage.removeOrgError'),
      t('pages.adminTotemsPage.removeOrgSuccess'),
      t('pages.adminTotemsPage.unassignOrgConfirm'),
      t('pages.adminTotemsPage.unassignOrgDescription'),
      t('pages.adminTotemsPage.unassignOrgTitle'),
    ],
  );

  const handleViewAssignments = useCallback(async (totem: AdminTotemResponse) => {
    setAssignmentsTotem(totem);
    setAssignmentsPage(1);
    setIsLoadingAssignments(true);
    setAssignments([]);

    try {
      const response = await adminTotemsClient.getTotemAssignments(totem.id);
      if (!response.success) {
        throw new Error(response.error.message);
      }

      setAssignments(response.data);
    } catch {
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  const handleRemoveAssignmentHistory = useCallback(
    async (assignmentId: string) => {
      if (!assignmentsTotem) return;

      const confirmed = await confirm.confirm({
        title: t('pages.adminTotemsPage.removeHistoryTitle'),
        description: t('pages.adminTotemsPage.removeHistoryDescription'),
        confirmLabel: t('pages.adminTotemsPage.removeHistory'),
        variant: 'destructive',
      });
      if (!confirmed) return;

      try {
        const response = await adminTotemsClient.removeAssignmentHistory(assignmentsTotem.id, assignmentId);
        if (!response.success) {
          throw new Error(response.error.message);
        }

        setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId));
        toast.success(t('pages.adminTotemsPage.removeHistorySuccess'));
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.adminTotemsPage.removeHistoryError');
        toast.error(message);
      }
    },
    [
      assignmentsTotem,
      confirm,
      t('pages.adminTotemsPage.removeHistory'),
      t('pages.adminTotemsPage.removeHistoryDescription'),
      t('pages.adminTotemsPage.removeHistoryError'),
      t('pages.adminTotemsPage.removeHistorySuccess'),
      t('pages.adminTotemsPage.removeHistoryTitle'),
    ],
  );

  const assignmentsTotalPages = useMemo(() => {
    if (assignments.length === 0) return 1;
    return Math.ceil(assignments.length / ASSIGNMENTS_PER_PAGE);
  }, [assignments.length]);

  const pagedAssignments = useMemo(() => {
    const start = (assignmentsPage - 1) * ASSIGNMENTS_PER_PAGE;
    return assignments.slice(start, start + ASSIGNMENTS_PER_PAGE);
  }, [assignments, assignmentsPage]);

  useEffect(() => {
    if (assignmentsPage > assignmentsTotalPages) {
      setAssignmentsPage(assignmentsTotalPages);
    }
  }, [assignmentsPage, assignmentsTotalPages]);

  const getStatusBadge = useCallback(
    (status: TotemAssignmentHistory['status']) => {
      if (status === 'ACTIVE') {
        return <Badge className="bg-emerald-500/15 text-emerald-700">{t('pages.adminTotemsPage.statusActive')}</Badge>;
      }
      if (status === 'SCHEDULED') {
        return <Badge className="bg-sky-500/15 text-sky-700">{t('pages.adminTotemsPage.statusScheduled')}</Badge>;
      }
      if (status === 'REVOKED') {
        return <Badge className="bg-amber-500/20 text-amber-700">{t('pages.adminTotemsPage.statusRevoked')}</Badge>;
      }
      return <Badge className="bg-zinc-500/15 text-zinc-700">{t('pages.adminTotemsPage.statusExpired')}</Badge>;
    },
    [
      t('pages.adminTotemsPage.statusActive'),
      t('pages.adminTotemsPage.statusExpired'),
      t('pages.adminTotemsPage.statusRevoked'),
      t('pages.adminTotemsPage.statusScheduled'),
    ],
  );

  const submitAssignToOrganization = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!assignOrgTotem || !assignOrganizationId || !assignStartsAt || !assignEndsAt) {
        return;
      }

      const startsAt = new Date(assignStartsAt);
      const endsAt = new Date(assignEndsAt);

      if (startsAt >= endsAt) {
        toast.error(t('pages.adminTotemsPage.invalidDateRange'));
        return;
      }

      setIsAssigningOrg(true);
      try {
        const response = await adminTotemsClient.assignTotemToOrganization(assignOrgTotem.id, {
          organizationId: assignOrganizationId,
          startsAt,
          endsAt,
        });

        if (!response.success) {
          throw new Error(response.error.message);
        }

        await fetchTotems();
        toast.success(t('pages.adminTotemsPage.assignOrgSuccess'));
        setAssignOrgTotem(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.adminTotemsPage.assignOrgError');
        toast.error(message);
      } finally {
        setIsAssigningOrg(false);
      }
    },
    [assignEndsAt, assignOrgTotem, assignOrganizationId, assignStartsAt, fetchTotems, t],
  );

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('adminTotems.list.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('adminTotems.list.description')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminTotems.list.newTotem')}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('adminTotems.tabs.active')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('adminTotems.tabs.deleted')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <TotemFilters />
          {hasSelection && (
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
              <p className="text-sm font-medium">
                {t('adminTotems.actions.selected', { count: String(selectedIds.size) })}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  {t('adminTotems.actions.clearSelection')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
                  {t('adminTotems.actions.bulkDelete')}
                </Button>
              </div>
            </div>
          )}
          <TotemsTable
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateCode={handleGenerateCode}
            onRevokeCode={handleRevokeCode}
            onChangeStatus={handleChangeStatus}
            onAssignToOrganization={handleAssignToOrganization}
            onUnassignFromOrganization={handleUnassignFromOrganization}
            onViewAssignments={handleViewAssignments}
          />
        </TabsContent>

        <TabsContent value="deleted">
          <DeletedTotemsTable
            onRestore={handleRestore}
            onHardDelete={handleHardDelete}
            onBulkHardDelete={handleBulkHardDelete}
          />
        </TabsContent>
      </Tabs>

      <CreateTotemModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <EditTotemModal
        totem={editTotem}
        open={!!editTotem}
        onOpenChange={(open) => {
          if (!open) setEditTotem(null);
        }}
      />

      <DeleteTotemModal
        totem={deleteTotem}
        open={!!deleteTotem}
        onOpenChange={(open) => {
          if (!open) setDeleteTotem(null);
          else fetchDeletedTotems();
        }}
      />

      <RestoreTotemModal
        totem={restoreTotem}
        open={!!restoreTotem}
        onOpenChange={(open) => {
          if (!open) setRestoreTotem(null);
        }}
      />

      <HardDeleteTotemModal
        totem={hardDeleteTotem}
        open={!!hardDeleteTotem}
        onOpenChange={(open) => {
          if (!open) setHardDeleteTotem(null);
        }}
      />

      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.actions.bulkDelete')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.bulkDeleteConfirm', { count: String(selectedIds.size) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkHardDeleteConfirmOpen} onOpenChange={setBulkHardDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.deleted.bulkPermanentDelete')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.bulkHardDeleteConfirm', { count: String(pendingBulkHardDeleteIds.length) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkHardDeleteConfirmOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmBulkHardDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!revokeCodeTotem}
        onOpenChange={(open) => {
          if (!open) setRevokeCodeTotem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminTotems.actions.revokeCode')}</DialogTitle>
            <DialogDescription>
              {t('adminTotems.messages.revokeCodeConfirm', { name: revokeCodeTotem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeCodeTotem(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmRevokeCode} disabled={isRevokingCode}>
              {isRevokingCode ? t('common.actions.loading') : t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignOrgTotem} onOpenChange={(open) => !open && setAssignOrgTotem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.adminTotemsPage.assignOrgTitle')}</DialogTitle>
            <DialogDescription>
              {t('pages.adminTotemsPage.assignOrgDescription').replace('{name}', assignOrgTotem?.name ?? 'totem')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitAssignToOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pages.adminTotemsPage.organization')}</Label>
              <Select value={assignOrganizationId} onValueChange={setAssignOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.adminTotemsPage.selectOrganization')} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-org-start">{t('pages.adminTotemsPage.startDate')}</Label>
              <Input
                id="assign-org-start"
                type="datetime-local"
                value={assignStartsAt}
                onChange={(e) => setAssignStartsAt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-org-end">{t('pages.adminTotemsPage.endDate')}</Label>
              <Input
                id="assign-org-end"
                type="datetime-local"
                value={assignEndsAt}
                onChange={(e) => setAssignEndsAt(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAssignOrgTotem(null)}>
                {t('pages.adminTotemsPage.cancel')}
              </Button>
              <Button type="submit" disabled={isAssigningOrg}>
                {isAssigningOrg ? t('pages.adminTotemsPage.assigning') : t('pages.adminTotemsPage.assign')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignmentsTotem}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentsTotem(null);
            setAssignmentsPage(1);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('pages.adminTotemsPage.assignmentsTitle')}</DialogTitle>
            <DialogDescription>
              {t('pages.adminTotemsPage.assignmentsDescription').replace('{name}', assignmentsTotem?.name ?? 'totem')}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
            {isLoadingAssignments ? <p className="text-sm">{t('pages.adminTotemsPage.loading')}</p> : null}
            {!isLoadingAssignments && assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('pages.adminTotemsPage.noAssignments')}</p>
            ) : null}

            {pagedAssignments.map((assignment, index) => (
              <div key={String(assignment.id ?? index)} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {assignment.organizationName ?? t('pages.adminTotemsPage.unknownOrganization')}
                  </p>
                  {getStatusBadge(assignment.status)}
                </div>
                <p className="text-muted-foreground">
                  {formatDateTime(assignment.startsAt, locale)} - {formatDateTime(assignment.endsAt, locale)}
                </p>
                {assignment.status === 'SCHEDULED' ? (
                  <p className="text-xs text-sky-700">
                    {t('pages.adminTotemsPage.startsIn').replace(
                      '{value}',
                      formatRelativeDiff(assignment.startsAt, locale),
                    )}
                  </p>
                ) : null}
                <div className="mt-2 space-y-1">
                  {Array.isArray(assignment.events) && assignment.events.length > 0 ? (
                    assignment.events.map((event) => (
                      <div key={event.id} className="text-muted-foreground flex items-center justify-between gap-2">
                        <p>
                          {event.eventName} - {event.locationName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{formatDateTime(event.startsAt, locale)}</span>
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">{t('pages.adminTotemsPage.noEventAssignments')}</p>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAssignmentHistory(assignment.id)}>
                    {t('pages.adminTotemsPage.removeHistory')}
                  </Button>
                </div>
              </div>
            ))}

            {!isLoadingAssignments && assignments.length > ASSIGNMENTS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t pt-2">
                <p className="text-muted-foreground text-xs">
                  {t('pages.adminTotemsPage.paginationSummary')
                    .replace('{from}', String((assignmentsPage - 1) * ASSIGNMENTS_PER_PAGE + 1))
                    .replace('{to}', String(Math.min(assignmentsPage * ASSIGNMENTS_PER_PAGE, assignments.length)))
                    .replace('{total}', String(assignments.length))}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAssignmentsPage((page) => Math.max(page - 1, 1))}
                    disabled={assignmentsPage === 1}
                    aria-label={t('pages.adminTotemsPage.previousPage')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAssignmentsPage((page) => Math.min(page + 1, assignmentsTotalPages))}
                    disabled={assignmentsPage === assignmentsTotalPages}
                    aria-label={t('pages.adminTotemsPage.nextPage')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminTotemsPage() {
  return (
    <AdminTotemsProvider>
      <AdminTotemsPageContent />
    </AdminTotemsProvider>
  );
}
