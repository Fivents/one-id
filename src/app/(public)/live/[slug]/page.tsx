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
  if (diffSec < 60) return `ha ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'ha 1 min';
  if (diffMin < 60) return `ha ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour === 1) return 'ha 1h';
  return `ha ${diffHour}h`;
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

function getStatusConfig(status: EventStatus): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Ativo', variant: 'default', className: 'bg-success/15 text-success border-success/30 hover:bg-success/20' };
    case 'PUBLISHED':
      return { label: 'Publicado', variant: 'secondary', className: '' };
    case 'COMPLETED':
      return { label: 'Concluido', variant: 'outline', className: 'text-muted-foreground border-muted-foreground/30' };
    case 'DRAFT':
      return { label: 'Rascunho', variant: 'outline', className: 'text-warning border-warning/30' };
    case 'CANCELED':
      return { label: 'Cancelado', variant: 'destructive', className: '' };
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
      return 'Codigo';
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
          setError('Evento nao encontrado ou link expirado.');
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente novamente ou verifique o link.</p>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                fetchData();
              }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
        totalCheckIns={data.metrics.totalCheckIns}
        checkInRate={data.metrics.checkInRate}
        checkInsLastMinute={data.metrics.checkInsLastMinute}
      />

      <ProgressSection
        totalCheckIns={data.metrics.totalCheckIns}
        totalParticipants={data.metrics.totalParticipants}
        checkInRate={data.metrics.checkInRate}
      />

      <RecentCheckInsSection
        checkIns={data.recentCheckIns}
        newCheckInId={newCheckInId}
      />

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
  statusConfig: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string };
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  isRefreshing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shadow-sm">
          <Image src="/png/logo-white.png" alt="OneID" width={16} height={16} />
        </div>
        <span className="font-medium text-foreground">OneID</span>
        <span aria-hidden="true">·</span>
        <span>{organizationName}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{eventName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className={statusConfig.className} variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>
              {formatDateTime(startsAt)}
              {' '}-{' '}
              {formatDateTime(endsAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        value={totalParticipants}
        icon={<Users className="h-5 w-5 text-primary" />}
      />
      <MetricCard
        title="Check-ins"
        value={totalCheckIns}
        icon={<CheckCircle className="h-5 w-5 text-success" />}
      />
      <MetricCard
        title="Taxa"
        value={`${checkInRate}%`}
        icon={<Activity className="h-5 w-5 text-warning" />}
      />
      <MetricCard
        title="1 min"
        value={checkInsLastMinute}
        icon={<Clock className="h-5 w-5 text-chart-2" />}
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
    <Card className={`bg-card/80 backdrop-blur-sm ${highlight ? 'ring-1 ring-success/50' : 'shadow-sm'}`}>
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2">{icon}</div>
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
    <Card className="bg-card/80 backdrop-blur-sm shadow-sm">
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Progresso do check-in</span>
          <span className="text-sm text-muted-foreground">
            {totalCheckIns}
            {' '}
            de
            {' '}
            {totalParticipants}
            {' '}
            participantes
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(checkInRate, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {checkInRate}% de taxa de credenciamento
        </p>
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
    <Card className="bg-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Ultimos check-ins</CardTitle>
        <CardDescription>Ultimos 10 participantes credenciados</CardDescription>
      </CardHeader>
      <CardContent>
        {checkIns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
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
                  className={`flex items-center justify-between rounded-lg border bg-card/50 p-3 transition-all duration-500 ${
                    isNew
                      ? 'border-primary/30 bg-primary/5 shadow-sm'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-medium text-primary-foreground">
                      {checkIn.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{checkIn.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        Nome protegido
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" className="gap-1 border-border text-xs font-normal">
                      <MethodIcon className="h-3 w-3" />
                      {getMethodLabel(checkIn.method)}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
    <div className="border-t border-border/50 pt-6">
      <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary shadow-sm">
            <Image src="/png/logo-white.png" alt="OneID" width={14} height={14} />
          </div>
          <span className="text-sm font-medium text-foreground">OneID by Fivents</span>
        </div>
        <p>Credenciamento inteligente para eventos</p>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
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
