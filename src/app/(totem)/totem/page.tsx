'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { KeyRound, Loader2, MonitorSmartphone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="bg-primary/20 absolute inset-0 rounded-full blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 ring-2 ring-slate-700">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        </div>
        <p className="text-sm text-slate-400">Validando sessão do totem...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      {/* Background glow effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/10 absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md">
        {/* Gradient border wrapper */}
        <div className="from-primary/50 absolute -inset-[1px] rounded-3xl bg-gradient-to-br via-slate-700/50 to-cyan-500/30" />

        <div className="relative rounded-3xl bg-slate-900/95 backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center px-8 pt-10 pb-2">
            <div className="relative mb-6">
              {/* Animated glow ring */}
              <div className="from-primary/30 animate-totem-glow absolute -inset-3 rounded-full bg-gradient-to-br to-cyan-500/20 blur-lg" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl ring-2 ring-slate-700/50">
                <MonitorSmartphone className="h-10 w-10 text-cyan-400" />
              </div>
              <div className="bg-primary absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">Totem Check-in</h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              Digite a chave do totem para iniciar o modo de credenciamento
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pt-6 pb-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="totem-key" className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Chave do Totem
                </label>
                <div className="relative">
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
                    className="focus:border-primary focus:ring-primary/20 h-14 border-slate-700/50 bg-slate-800/50 pl-12 font-mono text-lg tracking-widest uppercase placeholder:text-slate-600"
                    placeholder="AB12CD34"
                  />
                  <KeyRound className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <Button
                className="shadow-primary/25 hover:shadow-primary/30 relative h-14 w-full overflow-hidden text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
                disabled={isSubmitting || !key.trim()}
                onClick={() => void handleLogin()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    Entrar no Totem
                    <span className="ml-2 opacity-60">→</span>
                  </>
                )}
              </Button>
            </div>

            {/* Footer info */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span>Conexão segura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
