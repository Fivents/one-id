'use client';

import { ReactNode } from 'react';

import { TotemProvider } from '@/core/application/contexts/totem-context';

export default function TotemLayout({ children }: { children: ReactNode }) {
  return <TotemProvider>{children}</TotemProvider>;
}
