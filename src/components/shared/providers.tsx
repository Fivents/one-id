'use client';

import { usePathname } from 'next/navigation';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { ConfirmProvider } from '@/components/shared/confirm-dialog';
import { SyncProvider } from '@/components/shared/sync-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProviders } from '@/core/application/contexts';
import { I18nProvider } from '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The kiosk is designed dark-only; following a light system theme made its text unreadable.
  const forcedTheme = pathname?.startsWith('/totem') ? 'dark' : undefined;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      <I18nProvider>
        <AppProviders>
          <TooltipProvider>
            <ConfirmProvider>
              <SyncProvider>{children}</SyncProvider>
              <Toaster richColors position="top-right" />
            </ConfirmProvider>
          </TooltipProvider>
        </AppProviders>
      </I18nProvider>
    </NextThemesProvider>
  );
}
