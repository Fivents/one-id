'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Loader2, MonitorCheck } from 'lucide-react';
import { toast } from 'sonner';

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { eventsClient, type OrganizationTotemListResponse, orgTotemsClient } from '@/core/application/client-services';
import { useApp, useAuth, useOrganization, usePermissions } from '@/core/application/contexts';
import type { EventSummaryResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';

function toDateTimeLocalValue(value: Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function OrganizationTotemsPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isLoading: isOrganizationsLoading,
  } = useOrganization();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { locale, t } = useI18n();

  const confirm = useConfirm();

  const canView = isSuperAdmin() || hasPermission('TOTEM_VIEW');
  const canManage = isSuperAdmin() || hasPermission('TOTEM_MANAGE');

  const isLoadingPage = isAppLoading || isAuthLoading || isOrganizationsLoading;
  const hasOrganizationAccess =
    isSuperAdmin() || organizations.some((organization) => organization.id === organizationId);

  const [isLoading, setIsLoading] = useState(true);
  const [totems, setTotems] = useState<OrganizationTotemListResponse[]>([]);
  const [events, setEvents] = useState<EventSummaryResponse[]>([]);
  const [assigningTotem, setAssigningTotem] = useState<OrganizationTotemListResponse | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [formEventId, setFormEventId] = useState('');
  const [formLocationName, setFormLocationName] = useState('Main entrance');
  const [formStartsAt, setFormStartsAt] = useState(() => toDateTimeLocalValue(new Date()));
  const [formEndsAt, setFormEndsAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 12);
    return toDateTimeLocalValue(date);
  });

  const organizationEvents = useMemo(() => {
    return events.filter((event) => event.organizationId === organizationId);
  }, [events, organizationId]);

  const availableEvents = useMemo(() => {
    const now = Date.now();

    return organizationEvents
      .filter((event) => new Date(event.endsAt).getTime() >= now)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [organizationEvents]);

  const expiredEventsCount = useMemo(() => {
    return Math.max(organizationEvents.length - availableEvents.length, 0);
  }, [availableEvents.length, organizationEvents.length]);

  const loadData = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const [totemsResponse, eventsResponse] = await Promise.all([
        orgTotemsClient.getOrganizationTotems(organizationId),
        eventsClient.getEventsByOrganization(organizationId),
      ]);

      if (!totemsResponse.success) throw new Error(totemsResponse.error.message);
      if (!eventsResponse.success) throw new Error(eventsResponse.error.message);

      setTotems(totemsResponse.data);
      setEvents(eventsResponse.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.organizationTotems.loadError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, t('pages.organizationTotems.loadError')]);

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || !canView)) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, canView, router]);

  useEffect(() => {
    if (!isAuthenticated || !canView) return;

    if (!hasOrganizationAccess && !isSuperAdmin()) {
      if (organizations.length > 0) {
        router.replace(`/organizations/${organizations[0].id}/totems`);
      }
      return;
    }

    loadData();
  }, [isAuthenticated, canView, hasOrganizationAccess, isSuperAdmin, organizations, router, loadData]);

  const handleOrganizationChange = useCallback(
    (nextOrganizationId: string) => {
      const selectedOrganization = organizations.find((organization) => organization.id === nextOrganizationId);
      if (!selectedOrganization) return;

      setActiveOrganization(selectedOrganization);
      router.push(`/organizations/${selectedOrganization.id}/totems`);
    },
    [organizations, router, setActiveOrganization],
  );

  const openAssignModal = useCallback((totem: OrganizationTotemListResponse) => {
    setAssigningTotem(totem);
    setFormEventId('');
    setFormLocationName(totem.activeEvent?.locationName ?? 'Main entrance');
    setFormStartsAt(toDateTimeLocalValue(new Date()));

    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 12);
    setFormEndsAt(toDateTimeLocalValue(endsAt));
  }, []);

  const closeAssignModal = useCallback(() => {
    if (isAssigning) return;
    setAssigningTotem(null);
  }, [isAssigning]);

  const handleAssignEvent = useCallback(async () => {
    if (!assigningTotem) return;
    if (!formEventId) {
      toast.error(t('pages.organizationTotems.selectEventFirst'));
      return;
    }

    const startsAt = new Date(formStartsAt);
    const endsAt = new Date(formEndsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      toast.error(t('pages.organizationTotems.invalidDate'));
      return;
    }

    if (endsAt <= startsAt) {
      toast.error(t('pages.organizationTotems.invalidRange'));
      return;
    }

    setIsAssigning(true);
    try {
      const response = await orgTotemsClient.assignTotemToEvent(assigningTotem.totemId, {
        eventId: formEventId,
        locationName: formLocationName.trim() || t('pages.organizationTotems.locationPlaceholder'),
        startsAt,
        endsAt,
      });

      if (!response.success) throw new Error(response.error.message);

      toast.success(t('pages.organizationTotems.assignSuccess'));
      setAssigningTotem(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.organizationTotems.assignError');
      toast.error(message);
    } finally {
      setIsAssigning(false);
    }
  }, [assigningTotem, formEndsAt, formEventId, formLocationName, formStartsAt, loadData, t]);

  const handleUnassignEvent = useCallback(
    async (totem: OrganizationTotemListResponse) => {
      if (!totem.activeEvent) return;

      const accepted = await confirm.confirm({
        title: t('pages.organizationTotems.unassignTitle'),
        description: t('pages.organizationTotems.unassignDescription').replace('{name}', totem.totemName),
        confirmLabel: t('pages.organizationTotems.unassignConfirm'),
        variant: 'destructive',
      });

      if (!accepted) return;

      try {
        const response = await orgTotemsClient.unassignTotemFromEvent(totem.totemId);
        if (!response.success) throw new Error(response.error.message);

        toast.success(t('pages.organizationTotems.unassignSuccess'));
        await loadData();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.organizationTotems.unassignError');
        toast.error(message);
      }
    },
    [confirm, loadData, t],
  );

  if (isLoadingPage || !isAuthenticated || !canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <MonitorCheck className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('pages.organizationTotems.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('pages.organizationTotems.subtitlePrefix')}{' '}
              {activeOrganization?.name ?? t('pages.organizationTotems.subtitleFallback')}
            </p>
          </div>
        </div>

        {organizations.length > 0 && (
          <Select value={organizationId} onValueChange={handleOrganizationChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('pages.organizationTotems.selectOrganization')} />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('pages.organizationTotems.thTotem')}</TableHead>
              <TableHead>{t('pages.organizationTotems.thStatus')}</TableHead>
              <TableHead>{t('pages.organizationTotems.thOrgAssignment')}</TableHead>
              <TableHead>{t('pages.organizationTotems.thActiveEvent')}</TableHead>
              <TableHead>{t('pages.organizationTotems.thLocation')}</TableHead>
              <TableHead className="w-[220px] text-right">{t('pages.organizationTotems.thActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('pages.organizationTotems.loading')}
                  </div>
                </TableCell>
              </TableRow>
            ) : totems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                  {t('pages.organizationTotems.empty')}
                </TableCell>
              </TableRow>
            ) : (
              totems.map((totem) => (
                <TableRow key={totem.totemOrganizationSubscriptionId}>
                  <TableCell className="font-medium">{totem.totemName}</TableCell>
                  <TableCell>
                    <Badge variant={totem.totemStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                      {totem.totemStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(totem.startsAt, locale)} - {formatDateTime(totem.endsAt, locale)}
                  </TableCell>
                  <TableCell>{totem.activeEvent?.eventName ?? t('pages.organizationTotems.noActiveEvent')}</TableCell>
                  <TableCell>{totem.activeEvent?.locationName ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canManage && (
                        <Button variant="outline" size="sm" onClick={() => openAssignModal(totem)}>
                          {t('pages.organizationTotems.assignEvent')}
                        </Button>
                      )}
                      {canManage && totem.activeEvent && (
                        <Button variant="destructive" size="sm" onClick={() => handleUnassignEvent(totem)}>
                          {t('pages.organizationTotems.unassign')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!assigningTotem} onOpenChange={(open) => !open && closeAssignModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.organizationTotems.assignTitle')}</DialogTitle>
            <DialogDescription>
              {t('pages.organizationTotems.assignDescription').replace('{name}', assigningTotem?.totemName ?? '')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-id">{t('pages.organizationTotems.event')}</Label>
              <Select value={formEventId} onValueChange={setFormEventId}>
                <SelectTrigger id="event-id">
                  <SelectValue placeholder={t('pages.organizationTotems.selectEvent')} />
                </SelectTrigger>
                <SelectContent>
                  {availableEvents.length === 0 ? (
                    <SelectItem disabled value="no-events">
                      {t('pages.organizationTotems.noEventsAvailable')}
                    </SelectItem>
                  ) : (
                    availableEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {expiredEventsCount > 0 && availableEvents.length === 0 ? (
                <p className="text-xs text-amber-700">{t('pages.organizationTotems.expiredEventsOnlyNotice')}</p>
              ) : null}
              {expiredEventsCount > 0 && availableEvents.length > 0 ? (
                <p className="text-xs text-amber-700">
                  {t('pages.organizationTotems.expiredEventsSomeNotice').replace('{count}', String(expiredEventsCount))}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-name">{t('pages.organizationTotems.locationName')}</Label>
              <Input
                id="location-name"
                value={formLocationName}
                onChange={(event) => setFormLocationName(event.target.value)}
                placeholder={t('pages.organizationTotems.locationPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts-at">{t('pages.organizationTotems.startsAt')}</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(event) => setFormStartsAt(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends-at">{t('pages.organizationTotems.endsAt')}</Label>
                <Input
                  id="ends-at"
                  type="datetime-local"
                  value={formEndsAt}
                  onChange={(event) => setFormEndsAt(event.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAssignModal} disabled={isAssigning}>
              {t('pages.organizationTotems.cancel')}
            </Button>
            <Button type="button" onClick={handleAssignEvent} disabled={isAssigning || !canManage}>
              {isAssigning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('pages.organizationTotems.assigning')}
                </span>
              ) : (
                t('pages.organizationTotems.assignAction')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
