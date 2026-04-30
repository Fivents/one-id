'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleSync() {
      router.refresh();
    }

    window.addEventListener('fivents-sync', handleSync);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('fivents-sync-channel');
      bc.addEventListener('message', (event: MessageEvent) => {
        if (event.data?.type === 'mutation') {
          handleSync();
        }
      });
    }

    return () => {
      window.removeEventListener('fivents-sync', handleSync);
      if (bc) {
        bc.close();
      }
    };
  }, [router]);

  return <>{children}</>;
}
