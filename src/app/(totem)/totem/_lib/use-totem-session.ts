'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { clearTotemToken, getTotemSession, type TotemSessionResponse } from '@/core/application/client-services/totem';

interface UseTotemSessionOptions {
  required?: boolean;
  redirectTo?: string;
}

export function useTotemSession(options: UseTotemSessionOptions = {}) {
  const { required = true, redirectTo = '/totem' } = options;
  const router = useRouter();

  const [session, setSession] = useState<TotemSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await getTotemSession();

    if (!response.success) {
      setSession(null);
      setError(response.error.message);
      setIsLoading(false);

      if (required) {
        clearTotemToken();
        router.replace(redirectTo);
      }

      return null;
    }

    setSession(response.data);
    setIsLoading(false);
    return response.data;
  }, [required, redirectTo, router]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [refreshSession]);

  return {
    session,
    isLoading,
    error,
    refreshSession,
  };
}
