'use client';

import { useCallback, useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { AlertTriangle, Loader2, Plug } from 'lucide-react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { symplaClient, type SymplaConnectionStatusResponse } from '@/core/application/client-services';
import { usePermissions } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

type SyncStatus = 'IDLE' | 'SYNCING' | 'COMPLETED' | 'FAILED';

const SYNC_STATUS_KEY: Record<SyncStatus, string> = {
  IDLE: 'integrations.sympla.syncStatusIdle',
  SYNCING: 'integrations.sympla.syncStatusSyncing',
  COMPLETED: 'integrations.sympla.syncStatusCompleted',
  FAILED: 'integrations.sympla.syncStatusFailed',
};

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function IntegrationsPage() {
  const params = useParams();
  const organizationId = typeof params.organizationId === 'string' ? params.organizationId : '';
  const { t, locale } = useI18n();
  const { hasPermission } = usePermissions();
  const { confirm } = useConfirm();

  const canManage = hasPermission('ORGANIZATION_UPDATE');

  const [status, setStatus] = useState<SymplaConnectionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Bumping this re-runs the effect. Fetching inside the effect (rather than calling a
  // setState-first loader from it) keeps every setState behind an await, which is what
  // react-hooks/set-state-in-effect is asking for.
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    void (async () => {
      const response = await symplaClient.getStatus(organizationId);
      if (cancelled) return;

      if (!response.success) {
        setStatus(null);
        setLoadError(response.error.message || t('integrations.sympla.loadError'));
        setIsLoading(false);
        return;
      }

      setStatus(response.data ?? { connected: false });
      setLoadError(null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, reloadNonce, t]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const handleConnect = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;

    setIsSubmitting(true);

    const response = await symplaClient.connect(organizationId, { token: trimmed });

    setIsSubmitting(false);

    if (!response.success) {
      // The backend already speaks pt-BR here (SymplaApiError), so surface it verbatim.
      toast.error(response.error.message);
      return;
    }

    // Never keep the credential in component state after it has been stored.
    setToken('');
    setIsEditingToken(false);
    toast.success(t('integrations.sympla.connectSuccess'));
    reload();
  };

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: t('integrations.sympla.disconnectConfirmTitle'),
      description: t('integrations.sympla.disconnectConfirmDescription'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    setIsDisconnecting(true);

    const response = await symplaClient.disconnect(organizationId);

    setIsDisconnecting(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(t('integrations.sympla.disconnectSuccess'));
    reload();
  };

  const isConnected = status?.connected === true && status.isActive;
  const showTokenField = canManage && (!isConnected || isEditingToken);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('integrations.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('integrations.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-lg p-2">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t('integrations.sympla.name')}</CardTitle>
                <CardDescription>{t('integrations.sympla.description')}</CardDescription>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {status?.connected
                  ? isConnected
                    ? t('integrations.sympla.statusConnected')
                    : t('integrations.sympla.statusInactive')
                  : t('integrations.sympla.statusDisconnected')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <p className="text-destructive text-sm">{loadError}</p>
              <Button variant="outline" size="sm" onClick={reload}>
                {t('common.actions.search')}
              </Button>
            </div>
          ) : (
            <>
              {status?.connected && status.needsAttention && (
                <div className="border-destructive/40 bg-destructive/10 flex items-start gap-3 rounded-lg border p-4">
                  <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">{t('integrations.sympla.needsAttention')}</p>
                </div>
              )}

              {status?.connected && (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('integrations.sympla.lastSync')}</p>
                    <p className="text-sm font-medium">
                      {status.lastSyncAt
                        ? formatDateTime(status.lastSyncAt, locale)
                        : t('integrations.sympla.neverSynced')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('common.status.pending')}</p>
                    <p className="text-sm font-medium">{t(SYNC_STATUS_KEY[status.lastSyncStatus])}</p>
                  </div>

                  {status.lastSyncResult && (
                    <>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          {t('integrations.sympla.participantsSynced')}
                        </p>
                        <p className="text-sm font-medium tabular-nums">
                          {status.lastSyncResult.participantsSynced}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{t('integrations.sympla.syncErrors')}</p>
                        <p className="text-sm font-medium tabular-nums">
                          {status.lastSyncResult.errors.length}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {showTokenField && (
                <div className="space-y-2">
                  <Label htmlFor="sympla-token">{t('integrations.sympla.tokenLabel')}</Label>
                  <Input
                    id="sympla-token"
                    type="password"
                    autoComplete="off"
                    value={token}
                    placeholder={t('integrations.sympla.tokenPlaceholder')}
                    onChange={(event) => setToken(event.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">{t('integrations.sympla.tokenHelp')}</p>
                </div>
              )}

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {showTokenField && (
                    <Button onClick={() => void handleConnect()} disabled={isSubmitting || !token.trim()}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? t('integrations.sympla.connecting') : t('integrations.sympla.connect')}
                    </Button>
                  )}

                  {isConnected && !isEditingToken && (
                    <Button variant="outline" onClick={() => setIsEditingToken(true)}>
                      {t('integrations.sympla.reconnect')}
                    </Button>
                  )}

                  {isEditingToken && isConnected && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditingToken(false);
                        setToken('');
                      }}
                    >
                      {t('common.actions.cancel')}
                    </Button>
                  )}

                  {status?.connected && status.isActive && (
                    <Button
                      variant="destructive"
                      onClick={() => void handleDisconnect()}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isDisconnecting
                        ? t('integrations.sympla.disconnecting')
                        : t('integrations.sympla.disconnect')}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
