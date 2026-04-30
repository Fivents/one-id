'use client';

import { CreditCard, Layers, Package, Tag } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminPlans } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export function UsageTab() {
  const { t } = useI18n();
  const { plans, categories, features } = useAdminPlans();

  const activePlans = plans.filter((p) => p.isActive);
  const totalSubscriptions = plans.reduce((sum, p) => sum + p._count.subscriptions, 0);
  const totalFeatureAssignments = plans.reduce((sum, p) => sum + p._count.planFeatures, 0);
  const avgPrice = plans.length > 0 ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t('adminPlans.usage.description')}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPlans.usage.totalPlans')}</CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-muted-foreground text-xs">
              {activePlans.length} {t('common.status.active').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPlans.usage.totalSubscriptions')}</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
            <p className="text-muted-foreground text-xs">{t('adminPlans.usage.activeOrganizations')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPlans.usage.totalFeatures')}</CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length}</div>
            <p className="text-muted-foreground text-xs">
              {totalFeatureAssignments} {t('adminPlans.usage.assignments')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPlans.usage.averagePrice')}</CardTitle>
            <Tag className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-muted-foreground text-xs">
              {categories.length} {t('adminPlans.usage.categories')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('adminPlans.usage.planBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('adminPlans.messages.noPlans')}</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const pct = totalSubscriptions > 0 ? (plan._count.subscriptions / totalSubscriptions) * 100 : 0;
                return (
                  <div key={plan.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-muted-foreground">
                        {plan._count.subscriptions} {t('adminPlans.usage.subscribers')} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
