'use client';

import { useCallback, useEffect, useState } from 'react';

import { Activity, CheckCircle, Clock, RefreshCw, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveData {
  event: {
    name: string;
    status: string;
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
    method: string;
    checkedInAt: string;
  }>;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicLivePage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchData = useCallback(async () => {
    if (!slug) return;

    try {
      const response = await fetch(`/api/public/live/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found or link expired.');
        } else {
          setError('Failed to load data.');
        }
        return;
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch {
      setError('Connection error. Trying again...');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [slug, fetchData]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md border-red-500/20 bg-slate-800/50 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'FACE_RECOGNITION':
        return 'Face';
      case 'QR_CODE':
        return 'QR Code';
      case 'MANUAL':
        return 'Manual';
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PUBLISHED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'COMPLETED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{data.event.name}</h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Badge className={getStatusColor(data.event.status)}>{data.event.status}</Badge>
            <span className="flex items-center gap-1 text-sm text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Updated {formatTime(data.updatedAt)}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            title="Participants"
            value={data.metrics.totalParticipants}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard title="Check-ins" value={data.metrics.totalCheckIns} icon={<CheckCircle className="h-5 w-5" />} />
          <MetricCard title="Rate" value={`${data.metrics.checkInRate}%`} icon={<Activity className="h-5 w-5" />} />
          <MetricCard
            title="Last min"
            value={data.metrics.checkInsLastMinute}
            icon={<Clock className="h-5 w-5" />}
            highlight={data.metrics.checkInsLastMinute > 0}
          />
        </div>

        {/* Progress Bar */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Check-in Progress</span>
              <span className="font-medium">
                {data.metrics.totalCheckIns} / {data.metrics.totalParticipants}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(data.metrics.checkInRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            <CardDescription className="text-slate-400">Last 10 check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentCheckIns.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No check-ins yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentCheckIns.map((checkIn, index) => (
                  <div
                    key={checkIn.id}
                    className={`flex items-center justify-between rounded-lg bg-slate-700/50 p-3 transition-all ${
                      index === 0 ? 'animate-pulse ring-1 ring-green-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-medium">
                        {checkIn.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{checkIn.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Badge variant="outline" className="border-slate-600">
                        {getMethodLabel(checkIn.method)}
                      </Badge>
                      <span>{formatTime(checkIn.checkedInAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">Powered by ONE-ID • Real-time check-in monitoring</p>
      </div>
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
    <Card className={`border-slate-700 bg-slate-800/50 ${highlight ? 'ring-1 ring-green-500/50' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="text-slate-400">{icon}</div>
          <div className="text-right">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-400">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-64 bg-slate-700" />
          <Skeleton className="mx-auto mt-2 h-4 w-32 bg-slate-700" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-slate-700" />
          ))}
        </div>
        <Skeleton className="h-20 bg-slate-700" />
        <Skeleton className="h-64 bg-slate-700" />
      </div>
    </div>
  );
}
