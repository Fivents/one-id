'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowRight, Bell, Building2, CalendarDays, CheckCircle2, LayoutDashboard, Monitor, Users } from 'lucide-react';

import { EventStatusBadge } from '@/components/organizations/events/event-status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsClient } from '@/core/application/client-services';
import { useAuth, useNotifications, useOrganization, usePermissions } from '@/core/application/contexts';
import type { EventSummaryResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';
import { formatDateTimeRange } from '@/lib/utils';

const UPCOMING_LIMIT = 5;
const ORGANIZATIONS_LIMIT = 6;

export default function DashboardPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { activeOrganization, organizations } = useOrganization();
  const { isSuperAdmin } = usePermissions();
  const { unreadCount } = useNotifications();

  const organizationId = activeOrganization?.id ?? organizations[0]?.id ?? user?.organizationId;
  const organizationName = activeOrganization?.name ?? organizations[0]?.name;
  const [events, setEvents] = useState<EventSummaryResponse[] | null>(null);
  // Captured with the response so the "upcoming" filter stays pure during render.
  const [loadedAt, setLoadedAt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!organizationId || !isSuperAdmin()) return;
    let cancelled = false;
    void eventsClient.getEventsByOrganization(organizationId).then((response) => {
      if (cancelled) return;
      setLoadedAt(Date.now());
      setLoadFailed(!response.success);
      setEvents(response.success ? response.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, isSuperAdmin, reloadKey]);

  const summary = useMemo(() => {
    const list = events ?? [];
    return {
      total: list.length,
      active: list.filter((event) => event.status === 'ACTIVE').length,
      participants: list.reduce((sum, event) => sum + event.participantsCount, 0),
      checkIns: list.reduce((sum, event) => sum + event.checkInsCount, 0),
      totems: list.filter((event) => event.status === 'ACTIVE').reduce((sum, event) => sum + event.totemsCount, 0),
    };
  }, [events]);

  // Live events first, then the nearest upcoming ones; finished and canceled events are noise here.
  const upcoming = useMemo(() => {
    return (events ?? [])
      .filter(
        (event) =>
          event.status === 'ACTIVE' ||
          (event.status !== 'COMPLETED' && event.status !== 'CANCELED' && new Date(event.endsAt).getTime() >= loadedAt),
      )
      .sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      })
      .slice(0, UPCOMING_LIMIT);
  }, [events, loadedAt]);

  useEffect(() => {
    // Org roles land on Events: that is where the day's operation and the live metrics are.
    if (user && !isSuperAdmin() && organizationId) {
      router.replace(`/organizations/${organizationId}/events`);
    }
  }, [user, isSuperAdmin, organizationId, router]);

  if (!user) return null;

  const isLoading = events === null;
  const format = (value: number) => value.toLocaleString(locale);
  const metric = (value: number) => (loadFailed ? '—' : format(value));
  const eventsHref = organizationId ? `/organizations/${organizationId}/events` : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={t('dashboard.title')}
        description={
          organizationName ? `${t('dashboard.home.scopeLabel')} ${organizationName}` : t('dashboard.description')
        }
        actions={
          eventsHref && (
            <Button variant="outline" asChild>
              <Link href={eventsHref}>
                {t('dashboard.home.viewAllEvents')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )
        }
      />

      {unreadCount > 0 && (
        <div
          className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-xl border px-4 py-3"
          role="status"
        >
          <Bell className="text-primary h-5 w-5" />
          <span className="text-sm">
            {unreadCount} {t('notifications.unread')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.home.activeNow')}
          value={metric(summary.active)}
          hint={
            loadFailed
              ? t('pages.eventDetail.dataUnavailable')
              : t('dashboard.home.activeNowHint', { count: format(summary.total) })
          }
          icon={CalendarDays}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          label={t('dashboard.superAdmin.participants')}
          value={metric(summary.participants)}
          hint={t('dashboard.home.participantsHint')}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          label={t('dashboard.superAdmin.checkIns')}
          value={metric(summary.checkIns)}
          hint={t('dashboard.home.checkInsHint')}
          icon={CheckCircle2}
          tone="brand"
          isLoading={isLoading}
        />
        <StatCard
          label={t('dashboard.home.totemsLive')}
          value={metric(summary.totems)}
          hint={t('dashboard.home.totemsLiveHint')}
          icon={Monitor}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 gap-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.home.upcomingTitle')}</CardTitle>
            <CardDescription>{t('dashboard.home.upcomingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : loadFailed ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
                <p className="text-muted-foreground text-sm">{t('pages.eventDetail.dataUnavailable')}</p>
                <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                  {t('pages.eventDetail.retry')}
                </Button>
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{t('dashboard.home.upcomingEmpty')}</p>
            ) : (
              <ul className="-mx-2 divide-y">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/organizations/${event.organizationId}/events/${event.id}`}
                      className="group hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors outline-none focus-visible:ring-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{event.name}</span>
                          <EventStatusBadge status={event.status} />
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {formatDateTimeRange(event.startsAt, event.endsAt, locale)}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium tabular-nums">
                          {format(event.checkInsCount)}
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            / {format(event.participantsCount)}
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">{t('dashboard.superAdmin.checkIns')}</p>
                      </div>
                      <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.home.organizationsTitle')}</CardTitle>
            <CardDescription>{t('dashboard.home.organizationsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{t('dashboard.home.organizationsEmpty')}</p>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {organizations.slice(0, ORGANIZATIONS_LIMIT).map((organization) => (
                  <li key={organization.id}>
                    <Link
                      href={`/organizations/${organization.id}/events`}
                      aria-label={t('dashboard.home.openOrganization', { name: organization.name })}
                      className="group hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors outline-none focus-visible:ring-2"
                    >
                      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Building2 className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{organization.name}</span>
                      <ArrowRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {organizations.length > ORGANIZATIONS_LIMIT && (
              <Button variant="link" className="mt-2 px-0" asChild>
                <Link href="/admin/organizations">{t('dashboard.home.organizationsTitle')} →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
