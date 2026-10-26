import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4">
      {/* A faint brand halo gives the lone card a sense of place without competing with the form. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]"
      />
      <div className="animate-page-in relative flex w-full justify-center">{children}</div>
      <p className="text-muted-foreground relative mt-8 text-xs">OneID by Fivents</p>
    </div>
  );
}
