import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background flex min-h-svh items-center justify-center p-4">{children}</div>;
}
