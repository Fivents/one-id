'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KeyRound, Loader2, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getTotemSession, loginTotem } from '@/core/application/client-services/totem';
import { resetFaceModelPreload } from '@/core/application/client-services/totem/face-preloader-manager.client';

export default function TotemLoginPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const response = await getTotemSession();
      if (!active) {
        return;
      }

      if (response.success) {
        router.replace('/totem/method');
        return;
      }

      resetFaceModelPreload();
      setIsCheckingSession(false);
    }

    void validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin() {
    if (!key.trim() || isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    const response = await loginTotem(key.trim().toUpperCase());

    if (!response.success) {
      setError(response.error.message);
      toast.error(response.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Totem conectado com sucesso.');
    router.replace('/totem/method');
  }

  if (isCheckingSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <p className="text-sm text-muted-foreground">Validando sessão do totem...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <Card className="totem-glass w-full max-w-sm border-border/50 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md">
            <Image src="/png/logo-white.png" alt="OneID" width={32} height={32} />
          </div>
          <CardTitle className="text-xl">Totem Check-in</CardTitle>
          <CardDescription>Digite a chave do totem para iniciar o credenciamento</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="totem-key">Chave do Totem</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="totem-key"
                  value={key}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setKey(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleLogin();
                    }
                  }}
                  className="h-12 pl-10 font-mono text-base tracking-[0.2em] uppercase placeholder:normal-case"
                  placeholder="AB12CD34"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'totem-error' : undefined}
                />
                <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {error && (
                <p id="totem-error" className="text-destructive text-sm">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting || !key.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <MonitorSmartphone className="h-5 w-5" />
                  Entrar no Totem
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span>Conexão segura</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
