'use client';

import { useCallback, useEffect, useState } from 'react';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type SymplaBreakdownRow,
  symplaClient,
  type SymplaEventMetricsResponse,
} from '@/core/application/client-services';
import { useI18n } from '@/i18n';

interface SymplaMetricsCardProps {
  eventId: string;
}

function formatPercent(value: number | null, locale: string): string {
  if (value === null) return '—';

  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value);
}

function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * A single-hue meter, not a chart.
 *
 * The data is one magnitude per named row, so a table with an inline meter reads faster than any
 * plot would and needs no categorical palette at all — identity comes from the row label, the
 * numbers wear text tokens, and the fill is the one project hue. Rounded data-end, recessive
 * track.
 */
function RateMeter({ value }: { value: number | null }) {
  const pct = value === null ? 0 : Math.min(Math.max(value, 0), 1) * 100;

  return (
    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden>
      <div className="bg-primary h-full rounded-full transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function Breakdown({
  title,
  rows,
  locale,
  emptyLabel,
  columnLabels,
}: {
  title: string;
  rows: SymplaBreakdownRow[];
  locale: string;
  emptyLabel: string;
  columnLabels: { tickets: string; checkedIn: string; rate: string; revenue: string };
}) {
  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs">
              <th className="pb-2 font-normal">&nbsp;</th>
              <th className="pb-2 pr-4 text-right font-normal">{columnLabels.tickets}</th>
              <th className="pb-2 pr-4 text-right font-normal">{columnLabels.checkedIn}</th>
              <th className="pb-2 pr-4 text-right font-normal">{columnLabels.rate}</th>
              <th className="pb-2 text-right font-normal">{columnLabels.revenue}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t">
                <td className="py-2 pr-4">
                  <div className="min-w-[8rem] space-y-1">
                    <span className="font-medium">{row.label}</span>
                    <RateMeter value={row.checkInRate} />
                  </div>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {formatCount(row.valid, locale)}
                  {row.cancelled > 0 && (
                    <span className="text-muted-foreground"> (−{formatCount(row.cancelled, locale)})</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatCount(row.checkedIn, locale)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPercent(row.checkInRate, locale)}</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(row.revenue, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SymplaMetricsCard({ eventId }: SymplaMetricsCardProps) {
  const { t, locale } = useI18n();

  const [metrics, setMetrics] = useState<SymplaEventMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await symplaClient.getEventMetrics(eventId);
      if (cancelled) return;

      if (!response.success) {
        setLoadError(response.error.message || t('integrations.sympla.metrics.loadError'));
        setIsLoading(false);
        return;
      }

      setMetrics(response.data ?? null);
      setLoadError(null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, reloadNonce, t]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const columnLabels = {
    tickets: t('integrations.sympla.metrics.tickets'),
    checkedIn: t('integrations.sympla.metrics.checkedIn'),
    rate: t('integrations.sympla.metrics.checkInRate'),
    revenue: t('integrations.sympla.metrics.revenue'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{t('integrations.sympla.metrics.title')}</CardTitle>
            <CardDescription>{t('integrations.sympla.metrics.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={reload} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t('integrations.sympla.metrics.refresh')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : loadError ? (
          <p className="text-destructive text-sm">{loadError}</p>
        ) : !metrics ? (
          <p className="text-muted-foreground text-sm">{t('integrations.sympla.metrics.empty')}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label={t('integrations.sympla.metrics.validTickets')}
                value={formatCount(metrics.totals.valid, locale)}
                hint={
                  metrics.totals.cancelled > 0
                    ? `${formatCount(metrics.totals.cancelled, locale)} ${t('integrations.sympla.metrics.cancelled').toLowerCase()}`
                    : undefined
                }
              />
              <StatTile
                label={t('integrations.sympla.metrics.checkedIn')}
                value={formatCount(metrics.totals.checkedIn, locale)}
              />
              <StatTile
                label={t('integrations.sympla.metrics.checkInRate')}
                value={formatPercent(metrics.totals.checkInRate, locale)}
              />
              <StatTile
                label={t('integrations.sympla.metrics.grossRevenue')}
                value={formatMoney(metrics.totals.grossRevenue, locale)}
                hint={`${t('integrations.sympla.metrics.netRevenue')}: ${formatMoney(metrics.totals.netRevenue, locale)}`}
              />
            </div>

            <Breakdown
              title={t('integrations.sympla.metrics.byTicketType')}
              rows={metrics.byTicketType}
              locale={locale}
              emptyLabel={t('integrations.sympla.metrics.empty')}
              columnLabels={columnLabels}
            />

            <Breakdown
              title={t('integrations.sympla.metrics.bySector')}
              rows={metrics.bySector}
              locale={locale}
              emptyLabel={t('integrations.sympla.metrics.empty')}
              columnLabels={columnLabels}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium">{t('integrations.sympla.metrics.byUtmSource')}</p>

              {metrics.byUtmSource.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('integrations.sympla.metrics.empty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-left text-xs">
                        <th className="pb-2 pr-4 font-normal">{t('integrations.sympla.metrics.source')}</th>
                        <th className="pb-2 pr-4 font-normal">{t('integrations.sympla.metrics.campaign')}</th>
                        <th className="pb-2 pr-4 text-right font-normal">
                          {t('integrations.sympla.metrics.orders')}
                        </th>
                        <th className="pb-2 pr-4 text-right font-normal">{columnLabels.tickets}</th>
                        <th className="pb-2 pr-4 text-right font-normal">{columnLabels.rate}</th>
                        <th className="pb-2 text-right font-normal">{columnLabels.revenue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.byUtmSource.map((row) => (
                        <tr key={`${row.source}:${row.campaign}`} className="border-t">
                          <td className="py-2 pr-4 font-medium">{row.source}</td>
                          <td className="text-muted-foreground py-2 pr-4">{row.campaign}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{formatCount(row.orders, locale)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{formatCount(row.tickets, locale)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {formatPercent(row.checkInRate, locale)}
                          </td>
                          <td className="py-2 text-right tabular-nums">{formatMoney(row.revenue, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
