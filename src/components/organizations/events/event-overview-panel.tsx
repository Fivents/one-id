'use client';

import { useEffect, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MonitorSmartphone,
  RotateCcw,
  Users,
} from 'lucide-react';

import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eventCheckinsClient, eventsClient } from '@/core/application/client-services';
import type {
  CheckInMethod,
  EventCheckInRealtimeResponse,
  EventCheckInStatsResponse,
} from '@/core/application/client-services/checkins/checkins-client.service';
import type { EventResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';
import { formatShortDateTime } from '@/lib/utils';

const LIVE_REFRESH_MS = 30_000;

interface EventOverviewPanelProps {
  event: EventResponse;
  totemsCount: number;
  getMethodLabel: (method: CheckInMethod) => string;
}

interface Totals {
  participants: number;
  present: number;
}

type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

interface Summary {
  totals: Loadable<Totals>;
  stats: Loadable<EventCheckInStatsResponse>;
}

// Stats is the heaviest query here, so it reloads on mount, when the tab regains focus
// (throttled) or on retry. Only the light realtime endpoint is polled.
const SUMMARY_MIN_REFRESH_MS = 60_000;

// Unfiltered totals: the participants/check-ins tabs pass their search box to the API,
// so their counts cannot be reused here without the overview changing as the user types.
async function fetchSummary(eventId: string): Promise<Summary> {
  const [allParticipants, presentParticipants, statsResponse] = await Promise.all([
    eventsClient.listEventParticipants(eventId, { pageSize: 1 }),
    eventsClient.listEventParticipants(eventId, { pageSize: 1, checkedIn: true }),
    eventCheckinsClient.getCheckInStats(eventId, {}),
  ]);

  return {
    totals:
      allParticipants.success && presentParticipants.success
        ? {
            status: 'ready',
            data: { participants: allParticipants.data.total, present: presentParticipants.data.total },
          }
        : { status: 'error' },
    stats: statsResponse.success ? { status: 'ready', data: statsResponse.data } : { status: 'error' },
  };
}

export function EventOverviewPanel({ event, totemsCount, getMethodLabel }: EventOverviewPanelProps) {
  const { t, locale } = useI18n();
  const [summary, setSummary] = useState<Summary>({ totals: { status: 'loading' }, stats: { status: 'loading' } });
  const [live, setLive] = useState<Loadable<EventCheckInRealtimeResponse>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  const isLive = event.status === 'ACTIVE';

  useEffect(() => {
    let cancelled = false;
    let lastLoadedAt = 0;
    const load = () => {
      lastLoadedAt = Date.now();
      void fetchSummary(event.id).then((next) => {
        if (!cancelled) setSummary(next);
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoadedAt > SUMMARY_MIN_REFRESH_MS) load();
    };

    load();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [event.id, reloadKey]);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    const load = () => {
      void eventCheckinsClient.subscribeToCheckIns(event.id).then((response) => {
        if (cancelled) return;
        // Keep the last good snapshot through a transient failure instead of blanking the card.
        setLive((previous) =>
          response.success
            ? { status: 'ready', data: response.data }
            : previous.status === 'ready'
              ? previous
              : { status: 'error' },
        );
      });
    };

    load();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, LIVE_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [event.id, isLive, reloadKey]);

  const retry = () => setReloadKey((key) => key + 1);
  const totals = summary.totals.status === 'ready' ? summary.totals.data : null;
  const stats = summary.stats.status === 'ready' ? summary.stats.data : null;
  const isLoadingTotals = summary.totals.status === 'loading';
  const isLoadingStats = summary.stats.status === 'loading';
  const unavailable = (
    <Unavailable
      message={t('pages.eventDetail.dataUnavailable')}
      retryLabel={t('pages.eventDetail.retry')}
      onRetry={retry}
    />
  );

  const attendance = totals && totals.participants > 0 ? (totals.present / totals.participants) * 100 : 0;
  const format = (value: number) => value.toLocaleString(locale);

  // The realtime route phrases alerts in English for logs; rebuild them per type for the UI.
  const liveAlerts: string[] = [];
  if (live.status === 'ready') {
    const alerts = live.data.alerts;
    if (alerts.some((alert) => alert.type === 'PEAK')) {
      liveAlerts.push(t('pages.eventDetail.alertPeak', { count: format(live.data.checkInsPerMinute) }));
    }
    const lowConfidence = alerts.find((alert) => alert.type === 'LOW_CONFIDENCE');
    if (lowConfidence) {
      const count = Number.parseInt(lowConfidence.message, 10);
      liveAlerts.push(
        Number.isFinite(count)
          ? t('pages.eventDetail.alertLowConfidence', { count: format(count) })
          : t('pages.eventDetail.alertLowConfidenceGeneric'),
      );
    }
    const offline = alerts.filter((alert) => alert.type === 'TOTEM_OFFLINE').length;
    if (offline > 0) liveAlerts.push(t('pages.eventDetail.alertTotemOffline', { count: format(offline) }));
  }

  const methods: Array<{ method: CheckInMethod; count: number }> = stats
    ? (
        [
          { method: 'FACE_RECOGNITION', count: stats.faceCount },
          { method: 'QR_CODE', count: stats.qrCount },
          { method: 'ACCESS_CODE', count: stats.accessCodeCount },
          { method: 'MANUAL', count: stats.manualCount },
        ] as Array<{ method: CheckInMethod; count: number }>
      ).sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t('pages.eventDetail.statParticipants')}
          value={totals ? format(totals.participants) : '—'}
          hint={summary.totals.status === 'error' ? t('pages.eventDetail.dataUnavailable') : undefined}
          icon={Users}
          isLoading={isLoadingTotals}
        />
        <StatCard
          label={t('pages.eventDetail.statPresent')}
          value={totals ? format(totals.present) : '—'}
          hint={
            totals
              ? t('pages.eventDetail.statPresentHint', { total: format(totals.participants) })
              : t('pages.eventDetail.dataUnavailable')
          }
          icon={CheckCircle2}
          tone="success"
          isLoading={isLoadingTotals}
        />
        <StatCard
          label={t('pages.eventDetail.statAttendance')}
          value={totals ? `${Math.round(attendance)}%` : '—'}
          progress={totals ? attendance : undefined}
          hint={totals ? t('pages.eventDetail.statAttendanceHint') : t('pages.eventDetail.dataUnavailable')}
          icon={Activity}
          tone="brand"
          isLoading={isLoadingTotals}
        />
        <StatCard
          label={t('pages.eventDetail.statCheckinRecords')}
          value={stats ? format(stats.total) : '—'}
          hint={stats ? t('pages.eventDetail.statCheckinRecordsHint') : t('pages.eventDetail.dataUnavailable')}
          icon={MonitorSmartphone}
          isLoading={isLoadingStats}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 gap-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('pages.eventDetail.methodsTitle')}</CardTitle>
            <CardDescription>{t('pages.eventDetail.methodsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <BarListSkeleton />
            ) : !stats ? (
              unavailable
            ) : stats.total === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">{t('pages.eventDetail.methodsEmpty')}</p>
            ) : (
              <BarList
                items={methods.map(({ method, count }) => ({
                  key: method,
                  label: getMethodLabel(method),
                  value: count,
                  share: (count / stats.total) * 100,
                }))}
                format={format}
              />
            )}
            {stats?.averageConfidence != null && (
              <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
                {t('pages.eventDetail.averageConfidence')}:{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {Math.round(stats.averageConfidence * 100)}%
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {isLive ? (
          <Card className="min-w-0 gap-4 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {t('pages.eventDetail.liveTitle')}
              </CardTitle>
              <CardDescription>{t('pages.eventDetail.liveDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" aria-live="polite">
              {live.status === 'loading' ? (
                <BarListSkeleton rows={3} />
              ) : live.status === 'error' ? (
                unavailable
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      {t('pages.eventDetail.liveLastCheckin')}
                    </p>
                    {live.data.lastCheckIn ? (
                      <>
                        <p className="mt-1 truncate font-medium">{live.data.lastCheckIn.participantName}</p>
                        <p className="text-muted-foreground text-xs">
                          {getMethodLabel(live.data.lastCheckIn.method)} ·{' '}
                          {formatShortDateTime(live.data.lastCheckIn.checkedInAt, locale)}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-sm">{t('pages.eventDetail.liveNoCheckin')}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xl font-semibold tabular-nums">{format(live.data.checkInsPerMinute)}</p>
                      <p className="text-muted-foreground text-xs">{t('pages.eventDetail.liveLastMinute')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold tabular-nums">
                        {live.data.activeTotemsNow}
                        <span className="text-muted-foreground text-sm font-normal"> / {totemsCount}</span>
                      </p>
                      <p className="text-muted-foreground text-xs">{t('pages.eventDetail.liveActiveTotems')}</p>
                    </div>
                  </div>
                  {liveAlerts.length > 0 && (
                    <ul className="space-y-2">
                      {liveAlerts.map((message) => (
                        <li
                          key={message}
                          className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
                        >
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                          <span>{message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-muted-foreground text-xs">{t('pages.eventDetail.liveUpdated')}</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <EventDetailsCard event={event} className="lg:col-span-2" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 gap-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('pages.eventDetail.totemUsageTitle')}</CardTitle>
            <CardDescription>{t('pages.eventDetail.totemUsageDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <BarListSkeleton />
            ) : !stats ? (
              unavailable
            ) : stats.totemUsage.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">{t('pages.eventDetail.totemUsageEmpty')}</p>
            ) : (
              <BarList
                items={stats.totemUsage.map((usage, index) => ({
                  key: usage.totemId ?? `app-${index}`,
                  label:
                    !usage.totemId && usage.totemName === 'App' ? t('pages.eventDetail.appSource') : usage.totemName,
                  sublabel: usage.totemId ? usage.locationName : undefined,
                  value: usage.count,
                  share: stats.total > 0 ? (usage.count / stats.total) * 100 : 0,
                }))}
                format={format}
              />
            )}
          </CardContent>
        </Card>
        {isLive && <EventDetailsCard event={event} className="lg:col-span-2" />}
      </div>
    </div>
  );
}

function EventDetailsCard({ event, className }: { event: EventResponse; className?: string }) {
  const { t, locale } = useI18n();
  const rows = [
    { icon: Calendar, label: t('pages.eventDetail.startDate'), value: formatShortDateTime(event.startsAt, locale) },
    { icon: Calendar, label: t('pages.eventDetail.endDate'), value: formatShortDateTime(event.endsAt, locale) },
    { icon: Clock, label: t('pages.eventDetail.timezone'), value: event.timezone },
    {
      icon: MapPin,
      label: t('pages.eventDetail.location'),
      value: event.addressDetails?.formattedAddress ?? event.address ?? '—',
    },
  ];

  return (
    <Card className={`gap-4 ${className ?? ''}`}>
      <CardHeader>
        <CardTitle>{t('pages.eventDetail.eventDetailsTitle')}</CardTitle>
        <CardDescription>{t('pages.eventDetail.eventDetailsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
                <row.icon className="size-4" aria-hidden />
                {row.label}
              </dt>
              <dd className="text-right text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

interface BarListItem {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  share: number;
}

/** Single-hue ranked bars: labels carry identity, so no legend or categorical palette is needed. */
function BarList({ items, format }: { items: BarListItem[]; format: (value: number) => string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key} title={`${item.label}: ${format(item.value)} (${Math.round(item.share)}%)`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{item.label}</span>
              {item.sublabel && <span className="text-muted-foreground"> · {item.sublabel}</span>}
            </span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              <span className="text-foreground font-medium">{format(item.value)}</span> · {Math.round(item.share)}%
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary/80 h-full origin-left rounded-full transition-transform duration-500 ease-out"
              style={{ transform: `scaleX(${Math.min(item.share, 100) / 100})` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Unavailable({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="size-3.5" />
        {retryLabel}
      </Button>
    </div>
  );
}

function BarListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}
