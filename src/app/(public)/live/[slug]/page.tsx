'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  KeyRound,
  QrCode,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type EventStatus = 'ACTIVE' | 'PUBLISHED' | 'COMPLETED' | 'DRAFT' | 'CANCELED';

type CheckInMethod = 'FACE_RECOGNITION' | 'QR_CODE' | 'ACCESS_CODE' | 'MANUAL';

// The public screen is pt-BR only; group thousands and use a decimal comma like the rest of the copy.
function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits });
}

interface LiveData {
  organizationName: string;
  event: {
    name: string;
    status: EventStatus;
    startsAt: string;
    endsAt: string;
  };
  metrics: {
    totalParticipants: number;
    /** Absent on responses from before the field existed; fall back to the record count. */
    presentParticipants?: number;
    totalCheckIns: number;
    checkInRate: number;
    checkInsLastMinute: number;
  };
  recentCheckIns: Array<{
    id: string;
    name: string;
    method: CheckInMethod;
    checkedInAt: string;
  }>;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'agora';
  if (diffSec < 60) return `há ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'há 1 min';
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour === 1) return 'há 1h';
  return `há ${diffHour}h`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type StatusVariant = 'success' | 'info' | 'brand' | 'neutral' | 'danger';

function getStatusConfig(status: EventStatus): { label: string; variant: StatusVariant } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Ativo', variant: 'success' };
    case 'PUBLISHED':
      return { label: 'Publicado', variant: 'info' };
    case 'COMPLETED':
      return { label: 'Concluído', variant: 'brand' };
    case 'DRAFT':
      return { label: 'Rascunho', variant: 'neutral' };
    case 'CANCELED':
      return { label: 'Cancelado', variant: 'danger' };
  }
}

function getMethodIcon(method: CheckInMethod) {
  switch (method) {
    case 'FACE_RECOGNITION':
      return ScanFace;
    case 'QR_CODE':
      return QrCode;
    case 'ACCESS_CODE':
      return KeyRound;
    case 'MANUAL':
      return User;
  }
}

function getMethodLabel(method: CheckInMethod): string {
  switch (method) {
    case 'FACE_RECOGNITION':
      return 'Facial';
    case 'QR_CODE':
      return 'QR Code';
    case 'ACCESS_CODE':
      return 'Código';
    case 'MANUAL':
      return 'Manual';
  }
}

export default function PublicLivePage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newCheckInId, setNewCheckInId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchData = useCallback(async () => {
    if (!slug) return;

    const isInitial = isLoading;
    if (!isInitial) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`/api/public/live/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Evento não encontrado ou link expirado.');
        } else {
          setError('Falha ao carregar dados.');
        }
        return;
      }
      const json = (await response.json()) as LiveData;
      setData((prev) => {
        if (prev && json.recentCheckIns.length > 0 && prev.recentCheckIns.length > 0) {
          const newestId = json.recentCheckIns[0].id;
          if (newestId !== prev.recentCheckIns[0].id) {
            setNewCheckInId(newestId);
            setTimeout(() => setNewCheckInId(null), 2000);
          }
        }
        return json;
      });
      setError(null);
    } catch {
      setError('Erro de conexao. Tentando novamente...');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [slug, isLoading]);

  useEffect(() => {
    if (!slug) return;

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [slug, fetchData]);

  const statusConfig = data ? getStatusConfig(data.event.status) : null;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-muted-foreground mt-1 text-sm">Tente novamente ou verifique o link.</p>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                fetchData();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Header
        organizationName={data.organizationName}
        eventName={data.event.name}
        statusConfig={statusConfig!}
        startsAt={data.event.startsAt}
        endsAt={data.event.endsAt}
        updatedAt={data.updatedAt}
        isRefreshing={isRefreshing}
      />

      <MetricsGrid
        totalParticipants={data.metrics.totalParticipants}
        totalCheckIns={data.metrics.presentParticipants ?? data.metrics.totalCheckIns}
        checkInRate={data.metrics.checkInRate}
        checkInsLastMinute={data.metrics.checkInsLastMinute}
      />

      <ProgressSection
        totalCheckIns={data.metrics.presentParticipants ?? data.metrics.totalCheckIns}
        totalParticipants={data.metrics.totalParticipants}
        checkInRate={data.metrics.checkInRate}
      />

      <RecentCheckInsSection checkIns={data.recentCheckIns} newCheckInId={newCheckInId} />

      <Footer />
    </div>
  );
}

function Header({
  organizationName,
  eventName,
  statusConfig,
  startsAt,
  endsAt,
  updatedAt,
  isRefreshing,
}: {
  organizationName: string;
  eventName: string;
  statusConfig: { label: string; variant: StatusVariant };
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  isRefreshing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-md shadow-sm">
          <Image src="/png/logo-white.png" alt="OneID" width={16} height={16} />
        </div>
        <span className="text-foreground font-medium">OneID</span>
        <span aria-hidden="true">·</span>
        <span>{organizationName}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{eventName}</h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span>
              {formatDateTime(startsAt)} - {formatDateTime(endsAt)}
            </span>
          </div>
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-primary animate-pulse' : 'bg-success'}`} />
          <span>{getRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function MetricsGrid({
  totalParticipants,
  totalCheckIns,
  checkInRate,
  checkInsLastMinute,
}: {
  totalParticipants: number;
  totalCheckIns: number;
  checkInRate: number;
  checkInsLastMinute: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <MetricCard
        title="Participantes"
        value={formatNumber(totalParticipants)}
        icon={<Users className="text-primary h-5 w-5" />}
      />
      <MetricCard
        title="Presentes"
        value={formatNumber(totalCheckIns)}
        icon={<CheckCircle className="text-success h-5 w-5" />}
      />
      <MetricCard
        title="Taxa de presença"
        value={`${formatNumber(checkInRate, 1)}%`}
        icon={<Activity className="text-warning h-5 w-5" />}
      />
      <MetricCard
        title="No último minuto"
        value={checkInsLastMinute}
        icon={<Clock className="text-chart-2 h-5 w-5" />}
        highlight={checkInsLastMinute > 0}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  highlight = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm ${highlight ? 'ring-success/50 ring-1' : 'shadow-sm'}`}>
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-muted-foreground text-xs">{title}</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ProgressSection({
  totalCheckIns,
  totalParticipants,
  checkInRate,
}: {
  totalCheckIns: number;
  totalParticipants: number;
  checkInRate: number;
}) {
  return (
    <Card className="bg-card/80 shadow-sm backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Progresso do check-in</span>
          <span className="text-muted-foreground text-sm">
            {formatNumber(totalCheckIns)} de {formatNumber(totalParticipants)} participantes
          </span>
        </div>
        <div className="bg-muted relative h-2.5 overflow-hidden rounded-full">
          <div
            className="from-primary to-primary/60 h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
            style={{ width: `${Math.min(checkInRate, 100)}%` }}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{formatNumber(checkInRate, 1)}% de taxa de credenciamento</p>
      </CardContent>
    </Card>
  );
}

function RecentCheckInsSection({
  checkIns,
  newCheckInId,
}: {
  checkIns: LiveData['recentCheckIns'];
  newCheckInId: string | null;
}) {
  return (
    <Card className="bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Últimos check-ins</CardTitle>
        <CardDescription>Últimos 10 participantes credenciados</CardDescription>
      </CardHeader>
      <CardContent>
        {checkIns.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-12">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <User className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Nenhum check-in realizado ainda</p>
            <p className="text-xs">Aguardando participantes...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => {
              const MethodIcon = getMethodIcon(checkIn.method);
              const isNew = checkIn.id === newCheckInId;

              return (
                <div
                  key={checkIn.id}
                  className={`bg-card/50 flex items-center justify-between rounded-lg border p-3 transition-all duration-500 ${
                    isNew ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-transparent'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="from-primary to-primary/60 text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-medium">
                      {checkIn.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{checkIn.name}</p>
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3" />
                        Nome protegido
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" className="border-border gap-1 text-xs font-normal">
                      <MethodIcon className="h-3 w-3" />
                      {getMethodLabel(checkIn.method)}
                    </Badge>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {getRelativeTime(checkIn.checkedInAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Footer() {
  return (
    <div className="border-border/50 border-t pt-6">
      <div className="text-muted-foreground flex flex-col items-center gap-2 text-center text-xs">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-md shadow-sm">
            <Image src="/png/logo-white.png" alt="OneID" width={14} height={14} />
          </div>
          <span className="text-foreground text-sm font-medium">OneID by Fivents</span>
        </div>
        <p>Credenciamento inteligente para eventos</p>
        <div className="flex items-center gap-1">
          <div className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
          <span>Dados atualizados em tempo real</span>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 sm:h-9 sm:w-80" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-24 rounded-xl" />

      <div className="space-y-3 rounded-xl border p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-52" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
