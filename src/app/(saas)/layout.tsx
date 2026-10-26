'use client';

import { ReactNode, useEffect, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { AppBreadcrumb, BreadcrumbProvider } from '@/components/shared/app-breadcrumb';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp, useAuth } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export default function SaasLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const [isLoadingTimedOut, setIsLoadingTimedOut] = useState(false);

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoadingTimedOut(true);
    }, 20_000);

    return () => {
      window.clearTimeout(timeoutId);
      // Reset on teardown rather than in the effect body: the flag only means anything while
      // a load is in flight, and this keeps every setState off the synchronous path.
      setIsLoadingTimedOut(false);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    if (isLoadingTimedOut) {
      return (
        <div className="flex min-h-svh items-center justify-center px-6">
          <div className="bg-card w-full max-w-md space-y-4 rounded-xl border p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">{t('nav.shell.loadTimeoutTitle')}</h2>
            <p className="text-muted-foreground text-sm">{t('nav.shell.loadTimeoutDescription')}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                {t('nav.shell.reload')}
              </Button>
              <Button onClick={() => router.replace('/login')}>{t('nav.shell.goToLogin')}</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-svh" aria-busy="true">
        <div className="bg-sidebar hidden w-64 shrink-0 border-r p-4 md:block">
          <Skeleton className="mb-6 h-8 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('nav.shell.skipToContent')}
        </a>
        <AppSidebar />
        {/* min-w-0 lets wide tables scroll inside their own container instead of stretching the page. */}
        <SidebarInset className="min-w-0">
          <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger
              className="-ml-1.5"
              aria-label={t('nav.shell.toggleSidebar')}
              title={t('nav.shell.toggleSidebar')}
            />
            <Separator orientation="vertical" className="mr-1 h-4!" />
            <AppBreadcrumb />
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <LanguageSwitcher />
            </div>
          </header>
          <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8">
            <div key={pathname} className="animate-page-in mx-auto w-full max-w-[1400px]">
              {children}
            </div>
          </div>
        </SidebarInset>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
