"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
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
