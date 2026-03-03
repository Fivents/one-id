'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { ConfirmProvider } from '@/components/shared/confirm-dialog';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <TooltipProvider>
          <ConfirmProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ConfirmProvider>
        </TooltipProvider>
      </I18nProvider>
    </NextThemesProvider>
  );
}
