'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  symplaClient,
  type SymplaEventLinkResponse,
  type SymplaEventOptionResponse,
} from '@/core/application/client-services';
import { useI18n } from '@/i18n';

interface SymplaLinkCardProps {
  eventId: string;
  organizationId: string;
  canManage: boolean;
}

function formatDateTime(value: string | null, locale: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function SymplaLinkCard({ eventId, organizationId, canManage }: SymplaLinkCardProps) {
  const { t, locale } = useI18n();
  const { confirm } = useConfirm();

  const [link, setLink] = useState<SymplaEventLinkResponse | null>(null);
  const [options, setOptions] = useState<SymplaEventOptionResponse[]>([]);
  const [selected, setSelected] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const linkResponse = await symplaClient.getEventLink(eventId);
      if (cancelled) return;

      if (!linkResponse.success) {
        setIsLoading(false);
        return;
      }

      setLink(linkResponse.data ?? { linked: false });

      // Only fetch the picker when there is something to pick — listing hits the Sympla API.
      if (linkResponse.data?.linked) {
        setIsLoading(false);
        return;
      }

      const eventsResponse = await symplaClient.listSymplaEvents(organizationId);
      if (cancelled) return;

      if (!eventsResponse.success) {
        setNotConnected(eventsResponse.error.code === 'SYMPLA_NOT_CONNECTED');
        setIsLoading(false);
        return;
      }

      setOptions(eventsResponse.data?.items ?? []);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, organizationId, reloadNonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setNotConnected(false);
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const handleLink = async () => {
    if (!selected) return;

    setIsLinking(true);
    const response = await symplaClient.linkEvent(eventId, { symplaEventIdHash: selected });
    setIsLinking(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    setSelected('');
    toast.success(t('integrations.sympla.event.linkSuccess'));
    reload();
  };

  const handleUnlink = async () => {
    const confirmed = await confirm({
      title: t('integrations.sympla.event.unlinkConfirmTitle'),
      description: t('integrations.sympla.event.unlinkConfirmDescription'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    setIsUnlinking(true);
    const response = await symplaClient.unlinkEvent(eventId);
    setIsUnlinking(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(t('integrations.sympla.event.unlinkSuccess'));
    reload();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const response = await symplaClient.syncEvent(eventId);
    setIsSyncing(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(
      response.data?.alreadyRunning
        ? t('integrations.sympla.event.syncAlreadyRunning')
        : t('integrations.sympla.event.syncQueued'),
    );
  };

  const isLinked = link?.linked === true;
  const linkedOption = isLinked ? options.find((o) => o.symplaEventIdHash === link.symplaEventIdHash) : undefined;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t('integrations.sympla.event.title')}</p>
          <p className="text-muted-foreground text-xs">{t('integrations.sympla.event.description')}</p>
        </div>
        {!isLoading && (
          <Badge variant={isLinked ? 'default' : 'secondary'}>
            {isLinked ? t('integrations.sympla.statusConnected') : t('integrations.sympla.statusDisconnected')}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : notConnected ? (
        <p className="text-muted-foreground text-sm">{t('integrations.sympla.event.notConnected')}</p>
      ) : isLinked ? (
        <div className="space-y-3">
          {link.cancelledOnSympla && (
            <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded-lg border p-3">
              <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">{t('integrations.sympla.event.cancelledWarning')}</p>
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">{t('integrations.sympla.event.linkedTo')}: </span>
            <span className="font-medium">{linkedOption?.name ?? link.symplaEventIdHash}</span>
          </div>

          <p className="text-muted-foreground text-xs">
            {t('integrations.sympla.event.lastSeed')}:{' '}
            {formatDateTime(link.lastSeedAt, locale) ?? t('integrations.sympla.event.neverSeeded')}
          </p>

          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => void handleSync()} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isSyncing ? t('integrations.sympla.event.syncing') : t('integrations.sympla.event.syncNow')}
              </Button>
            )}

            {link.symplaUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={link.symplaUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('integrations.sympla.event.openOnSympla')}
                </a>
              </Button>
            )}

            {canManage && (
              <Button variant="destructive" size="sm" onClick={() => void handleUnlink()} disabled={isUnlinking}>
                {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUnlinking ? t('integrations.sympla.event.unlinking') : t('integrations.sympla.event.unlink')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{t('integrations.sympla.event.notLinked')}</p>

          {canManage && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sympla-event">{t('integrations.sympla.event.selectEvent')}</Label>
                <Select value={selected} onValueChange={setSelected} disabled={options.length === 0}>
                  <SelectTrigger id="sympla-event" className="w-full max-w-md">
                    <SelectValue
                      placeholder={
                        options.length === 0
                          ? t('integrations.sympla.event.noEventsAvailable')
                          : t('integrations.sympla.event.selectPlaceholder')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem
                        key={option.symplaEventIdHash}
                        value={option.symplaEventIdHash}
                        disabled={option.linkedEventId !== null}
                      >
                        {option.name}
                        {option.linkedEventId !== null ? ` (${t('integrations.sympla.event.alreadyLinked')})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" onClick={() => void handleLink()} disabled={!selected || isLinking}>
                {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLinking ? t('integrations.sympla.event.linking') : t('integrations.sympla.event.link')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
