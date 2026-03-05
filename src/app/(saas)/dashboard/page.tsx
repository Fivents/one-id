'use client';

import { Bell, Building2, CalendarDays, Monitor, ShieldCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useNotifications, useOrganization, usePermissions } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { activeOrganization, organizations } = useOrganization();
  const { role, isSuperAdmin, isOrgOwner } = usePermissions();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      {unreadCount > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Bell className="text-primary h-5 w-5" />
            <span className="text-sm">
              {unreadCount} {t('notifications.unread')}
            </span>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin() ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dashboard.superAdmin.platformOverview')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('dashboard.superAdmin.organizations')}
              value={String(organizations.length)}
              icon={<Building2 className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.superAdmin.users')}
              value="—"
              icon={<Users className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.superAdmin.events')}
              value="—"
              icon={<CalendarDays className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.superAdmin.checkIns')}
              value="—"
              icon={<ShieldCheck className="text-muted-foreground h-4 w-4" />}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{t('dashboard.orgAdmin.orgOverview')}</h2>
            {activeOrganization && (
              <Badge variant="outline">{activeOrganization.name}</Badge>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('dashboard.orgAdmin.yourEvents')}
              value="—"
              icon={<CalendarDays className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.orgAdmin.yourParticipants')}
              value="—"
              icon={<Users className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.orgAdmin.yourCheckIns')}
              value="—"
              icon={<ShieldCheck className="text-muted-foreground h-4 w-4" />}
            />
            <StatCard
              title={t('dashboard.orgAdmin.yourTotems')}
              value="—"
              icon={<Monitor className="text-muted-foreground h-4 w-4" />}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.recentEvents')}</CardTitle>
            <CardDescription>{t('dashboard.recentEventsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t('dashboard.noEvents')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.recentCheckIns')}</CardTitle>
            <CardDescription>
              {isSuperAdmin()
                ? t('dashboard.recentCheckInsPlatform')
                : t('dashboard.recentCheckInsOrg')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t('dashboard.noCheckIns')}</p>
          </CardContent>
        </Card>
      </div>

      {(isSuperAdmin() || isOrgOwner()) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('dashboard.auditLog.title')}</CardTitle>
                <CardDescription>{t('dashboard.auditLog.description')}</CardDescription>
              </div>
              <Badge variant="secondary">{role}</Badge>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
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
