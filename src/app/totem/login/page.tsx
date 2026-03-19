'use client';

import { FormEvent, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginTotem } from '@/core/application/client-services';
import { useI18n } from '@/i18n';

export default function TotemLoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const canSubmit = useMemo(() => key.trim().length > 0 && !isLoading, [key, isLoading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!key.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsBlocked(false);

    try {
      const response = await loginTotem(key.trim());

      if (!response.success) {
        if (response.error.code === 'TOTEM_NO_ACTIVE_EVENT') {
          setIsBlocked(true);
          setError(t('pages.totemLogin.noActiveEvent'));
        } else {
          setError(response.error.message);
        }

        setIsLoading(false);
        return;
      }

      // Ensure token is stored before redirecting
      if (response.data.token) {
        // Add a small delay to ensure token is written to localStorage
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify token was stored
        const storedToken = localStorage.getItem('oneid.totem.token');
        if (!storedToken) {
          setError('Erro ao armazenar token. localStorage pode estar desabilitado.');
          setIsLoading(false);
          return;
        }
      }

      // Redirect to credentialing page
      router.replace('/totem/credentialing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer login';
      setError(errorMessage);
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-6 text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-[0_20px_90px_-50px_rgba(8,145,178,0.65)] backdrop-blur">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 p-2 text-cyan-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-wide">{t('pages.totemLogin.title')}</h1>
            <p className="text-sm text-zinc-400">{t('pages.totemLogin.subtitle')}</p>
          </div>
        </div>

        {isBlocked ? (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {t('pages.totemLogin.noActiveEvent')}
          </div>
        ) : null}

        {error && !isBlocked ? (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="totem-key" className="text-xs font-medium tracking-[0.16em] text-zinc-400 uppercase">
              {t('pages.totemLogin.keyLabel')}
            </label>
            <Input
              id="totem-key"
              value={key}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder={t('pages.totemLogin.keyPlaceholder')}
              onChange={(event) => setKey(event.target.value)}
              className="h-12 border-zinc-700 bg-zinc-950/60 text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full bg-cyan-500 font-semibold text-black hover:bg-cyan-400"
          >
            {isLoading ? t('pages.totemLogin.authenticating') : t('pages.totemLogin.enterKiosk')}
          </Button>
        </form>
      </section>
    </main>
  );
}
