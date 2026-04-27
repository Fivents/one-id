'use client';

import { ReactNode, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp, useAuth } from '@/core/application/contexts';

export default function SaasLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const [isLoadingTimedOut, setIsLoadingTimedOut] = useState(false);

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading) {
      setIsLoadingTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoadingTimedOut(true);
    }, 20_000);

    return () => {
      window.clearTimeout(timeoutId);
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
          <div className="bg-background w-full max-w-md space-y-4 rounded-xl border p-6 text-center">
            <h2 className="text-lg font-semibold">Nao foi possivel concluir o carregamento</h2>
            <p className="text-muted-foreground text-sm">
              A inicializacao da sessao demorou mais que o esperado. Tente recarregar ou voltar para o login.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                Recarregar
              </Button>
              <Button onClick={() => router.replace('/login')}>Ir para login</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-svh">
        <div className="bg-sidebar w-64 border-r p-4">
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
            <div className="mt-6 grid grid-cols-3 gap-4">
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
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
