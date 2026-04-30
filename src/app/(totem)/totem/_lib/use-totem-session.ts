'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { clearTotemToken, getTotemSession, type TotemSessionResponse } from '@/core/application/client-services/totem';

interface UseTotemSessionOptions {
  required?: boolean;
  redirectTo?: string;
}

export function useTotemSession(options: UseTotemSessionOptions = {}) {
  const { required = true, redirectTo = '/totem' } = options;
  const router = useRouter();
  const isMountedRef = useRef(true);
  const hasRedirectedRef = useRef(false);
  const redirectTimeoutRef = useRef<number | null>(null);

  const [session, setSession] = useState<TotemSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!isMountedRef.current) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getTotemSession();

      if (!isMountedRef.current) {
        return null;
      }

      if (!response.success) {
        setSession(null);
        setError(response.error.message);
        return null;
      }

      hasRedirectedRef.current = false;
      setSession(response.data);
      return response.data;
    } catch (error) {
      if (!isMountedRef.current) {
        return null;
      }

      const message = error instanceof Error ? error.message : 'Failed to refresh totem session.';
      setSession(null);
      setError(message);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshSession();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!required || !error || hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    clearTotemToken();
    router.replace(redirectTo);

    if (typeof window !== 'undefined') {
      redirectTimeoutRef.current = window.setTimeout(() => {
        if (window.location.pathname !== redirectTo) {
          window.location.replace(redirectTo);
        }
      }, 1200);
    }
  }, [required, error, redirectTo, router]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    session,
    isLoading,
    error,
    refreshSession,
  };
}
