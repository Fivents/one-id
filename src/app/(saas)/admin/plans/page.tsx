'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { CreditCard } from 'lucide-react';

import { CategoriesTab, FeaturesTab, PlansTab, UsageTab } from '@/components/admin/plans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPlansProvider, useAdminPlans, useApp, useAuth, usePermissions } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

function AdminPlansPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const { fetchPlans, fetchCategories, fetchFeatures } = useAdminPlans();
  const { t } = useI18n();

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchPlans();
      fetchCategories();
      fetchFeatures();
    }
  }, [isAuthenticated, isSuperAdmin, fetchPlans, fetchCategories, fetchFeatures]);

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <CreditCard className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('adminPlans.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('adminPlans.description')}</p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">{t('adminPlans.tabs.plans')}</TabsTrigger>
          <TabsTrigger value="categories">{t('adminPlans.tabs.categories')}</TabsTrigger>
          <TabsTrigger value="features">{t('adminPlans.tabs.features')}</TabsTrigger>
          <TabsTrigger value="usage">{t('adminPlans.tabs.usage')}</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4">
          <PlansTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="features" className="mt-4">
          <FeaturesTab />
        </TabsContent>
        <TabsContent value="usage" className="mt-4">
          <UsageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPlansPage() {
  return (
    <AdminPlansProvider>
      <AdminPlansPageContent />
    </AdminPlansProvider>
  );
}
