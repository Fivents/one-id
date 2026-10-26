'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { symplaClient, type SymplaConnectionStatusResponse } from '@/core/application/client-services';
import { useI18n } from '@/i18n';

// The Vercel Hobby cron runs once a day, so an open event page is what keeps an active event
// current. Sync is incremental (watermark on ticket updates), so a run every 2 min is cheap.
const AUTO_SYNC_MS = 2 * 60 * 1000;
const POLL_MS = 3_000;
const MAX_WAIT_MS = 75_000;

interface SymplaSyncStatusProps {
  eventId: string;
  organizationId: string;
  /** Auto-refresh only matters while the event is running. */
  autoSync: boolean;
  /** Called after a sync finishes so the caller can reload its list. */
  onSynced: () => void;
}

type Connected = Extract<SymplaConnectionStatusResponse, { connected: true }>;

function formatAgo(iso: string, locale: string, now: number): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return rtf.format(Math.min(seconds, 0), 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

export function SymplaSyncStatus({ eventId, organizationId, autoSync, onSynced }: SymplaSyncStatusProps) {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<Connected | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const runningRef = useRef(false);
  const onSyncedRef = useRef(onSynced);

  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);

  const readStatus = useCallback(async (): Promise<Connected | null> => {
    const response = await symplaClient.getStatus(organizationId);
    if (!response.success || !response.data.connected) return null;
    return response.data;
  }, [organizationId]);

  const sync = useCallback(
    async ({ silent }: { silent: boolean }) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setIsSyncing(true);

      try {
        const before = await readStatus();
        const response = await symplaClient.syncEvent(eventId);
        if (!response.success) {
          if (!silent) toast.error(t('pages.eventDetail.symplaSyncFailed'));
          return;
        }

        // The run happens server-side after the response; watch the connection until it settles.
        const deadline = Date.now() + MAX_WAIT_MS;
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, POLL_MS));
          const current = await readStatus();
          if (current) setStatus(current);
          const finished =
            current &&
            current.lastSyncStatus !== 'SYNCING' &&
            current.lastSyncAt !== null &&
            current.lastSyncAt !== before?.lastSyncAt;
          if (finished) {
            setNow(Date.now());
            if (current.lastSyncStatus === 'FAILED') {
              if (!silent) toast.error(t('pages.eventDetail.symplaSyncFailed'));
            } else {
              onSyncedRef.current();
              if (!silent) toast.success(t('pages.eventDetail.symplaSyncDone'));
            }
            return;
          }
        }
        if (!silent) toast.info(t('pages.eventDetail.symplaSyncStillRunning'));
      } finally {
        runningRef.current = false;
        setIsSyncing(false);
      }
    },
    [eventId, readStatus, t],
  );

  useEffect(() => {
    let cancelled = false;
    void readStatus().then((current) => {
      if (!cancelled) setStatus(current);
    });
    // Keeps "updated 3 min ago" honest without refetching.
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(clock);
    };
  }, [readStatus]);

  useEffect(() => {
    if (!autoSync) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void sync({ silent: true });
    }, AUTO_SYNC_MS);
    return () => window.clearInterval(intervalId);
  }, [autoSync, sync]);

  const label = isSyncing
    ? t('pages.eventDetail.symplaSyncingNow')
    : status?.lastSyncAt
      ? t('pages.eventDetail.symplaSyncedAgo', { ago: formatAgo(status.lastSyncAt, locale, now) })
      : t('pages.eventDetail.symplaNeverSynced');

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-live="polite">
      <span
        className="inline-flex items-center gap-1.5"
        title={autoSync ? t('pages.eventDetail.symplaAutoSyncOn') : undefined}
      >
        <span
          aria-hidden
          className={`size-1.5 rounded-full ${isSyncing ? 'animate-pulse bg-amber-500' : status?.lastSyncStatus === 'FAILED' ? 'bg-rose-500' : 'bg-emerald-500'}`}
        />
        {label}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => void sync({ silent: false })}
        disabled={isSyncing}
      >
        {isSyncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        {t('pages.eventDetail.symplaRefresh')}
      </Button>
    </div>
  );
}
