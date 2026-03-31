'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { KeyRound, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getTotemSession, loginTotem } from '@/core/application/client-services/totem';

export default function TotemLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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

    setIsSubmitting(true);
    const response = await loginTotem(key.trim());

    if (!response.success) {
      toast.error(response.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Totem conectado com sucesso.');
    router.replace('/totem/method');
  }

  if (isCheckingSession) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Validando sessão do totem...</div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
            <MonitorSmartphone className="h-7 w-7 text-cyan-300" />
          </div>
          <CardTitle className="text-2xl">Totem Check-in</CardTitle>
          <CardDescription>Digite a chave do totem para iniciar o modo credenciamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400" htmlFor="totem-key">
              Chave do Totem
            </label>
            <Input
              id="totem-key"
              value={key}
              autoFocus
              onChange={(event) => setKey(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleLogin();
                }
              }}
              className="border-slate-700 bg-slate-950"
              placeholder="Ex: AB12CD34"
            />
          </div>

          <Button className="w-full gap-2" disabled={isSubmitting || !key.trim()} onClick={() => void handleLogin()}>
            <KeyRound className="h-4 w-4" />
            {isSubmitting ? 'Conectando...' : 'Entrar no Totem'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
