import type { ReactNode } from 'react';

export default function TotemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="totem-gradient-bg flex min-h-svh flex-col text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">{children}</div>
    </div>
  );
}
