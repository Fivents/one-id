'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { ArrowLeft, Building2, Calendar, CreditCard, MonitorSmartphone, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AdminOrganizationsProvider,
  useAdminOrganizations,
  useApp,
  useAuth,
  usePermissions,
} from '@/core/application/contexts';
import { useI18n } from '@/i18n';

function OrganizationDetailContent() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const { selectedOrganization: org, isLoadingDetail, fetchOrganization } = useAdminOrganizations();
  const { t } = useI18n();

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin() && organizationId) {
      fetchOrganization(organizationId);
    }
  }, [isAuthenticated, isSuperAdmin, organizationId, fetchOrganization]);

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  if (isLoadingDetail) {
    return <DetailSkeleton />;
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">{t('organizations.list.noOrgs')}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.actions.back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="text-primary h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
              <Badge
                variant="outline"
                className={org.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-400/10 text-gray-500'}
              >
                {org.isActive ? t('common.status.active') : t('common.status.inactive')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{org.slug}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t('organizations.detail.events')}
          value={org._count.events}
          icon={<Calendar className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title={t('organizations.detail.members')}
          value={org._count.members}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Participants"
          value={org._count.participants}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Totems"
          value={org._count.totems}
          icon={<MonitorSmartphone className="text-muted-foreground h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizations.detail.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('common.labels.name')} value={org.name} />
            <InfoRow label="Slug" value={org.slug} />
            <InfoRow label="Email" value={org.email ?? '—'} />
            <InfoRow label={t('organizations.form.phone')} value={org.phone ?? '—'} />
            <InfoRow
              label={t('common.labels.status')}
              value={org.isActive ? t('common.status.active') : t('common.status.inactive')}
            />
            <InfoRow label={t('common.labels.createdAt')} value={new Date(org.createdAt).toLocaleDateString()} />
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {org.subscription ? (
              <div className="space-y-3">
                <InfoRow label="Current Plan" value={org.subscription.planName} />
                <InfoRow label="Started At" value={new Date(org.subscription.startedAt).toLocaleDateString()} />
                <InfoRow label="Expires At" value={new Date(org.subscription.expiresAt).toLocaleDateString()} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active subscription.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('organizations.detail.members')}</CardTitle>
          <CardDescription>
            {t('organizations.detail.membersDescription', { count: String(org.members.length) })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {org.members.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No members found.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.labels.name')}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {org.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrganizationDetailPage() {
  return (
    <AdminOrganizationsProvider>
      <OrganizationDetailContent />
    </AdminOrganizationsProvider>
  );
}
