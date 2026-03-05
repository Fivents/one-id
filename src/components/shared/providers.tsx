'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { ConfirmProvider } from '@/components/shared/confirm-dialog';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProviders } from '@/core/application/contexts';
import { I18nProvider } from '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <AppProviders>
          <TooltipProvider>
            <ConfirmProvider>
              {children}
              <Toaster richColors position="top-right" />
            </ConfirmProvider>
          </TooltipProvider>
        </AppProviders>
      </I18nProvider>
    </NextThemesProvider>
  );
}
