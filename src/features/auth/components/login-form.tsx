import { useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';

function getUrlErrorKey(urlError: string | null): string | null {
  switch (urlError) {
    case 'google_domain_invalid':
      return 'auth.errors.google_domain_invalid';
    case 'google_failed':
    case 'google_auth_failed':
    case 'google_token_failed':
    case 'google_userinfo_failed':
      return 'auth.errors.google_failed';
    default:
      return null;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const urlError = searchParams.get('error');
  const urlErrorKey = getUrlErrorKey(urlError);
  const [error, setError] = useState(urlErrorKey ? t(urlErrorKey) : '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.setupToken) {
        router.push(`/set-password?token=${data.setupToken}`);
        return;
      }

      if (!res.ok) {
        setError(data.error || t('auth.login.invalidCredentials'));
        return;
      }

      router.push('/dashboard');
    } catch {
      setError(t('auth.login.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleTokenSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const tokenCode = formData.get('token-code');

    try {
      const res = await fetch('/api/auth/token-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('auth.login.invalidToken'));
        return;
      }

      router.push('/dashboard');
    } catch {
      setError(t('auth.login.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  function handleSignInAsTotem() {
    console.info('Signing in as Totem user for development purposes');
  }

  return (
    <Card className="relative w-full max-w-md">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <CardHeader className="text-center">
        <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <Image src="/png/logo-white.png" alt="Logo" width={32} height={32} />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

        <Button variant="outline" className="w-full" asChild>
          <a href="/api/auth/google">
            <GoogleIcon className="mr-2 h-5 w-5" />
            {t('auth.login.googleButton')}
          </a>
        </Button>

        <p className="text-muted-foreground text-center text-xs">{t('auth.login.googleOnly')}</p>

        <div className="relative">
          <Separator />
          <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
            {t('common.actions.or')}
          </span>
        </div>
      </CardContent>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
          </Button>

          <div className="relative">
            <Separator />
            <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              {t('common.actions.or')}
            </span>
          </div>
        </CardContent>
      </form>

      <form onSubmit={handleTokenSubmit}>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="token-code">{t('auth.login.tokenCodeLabel')}</Label>
            <Input
              id="token-code"
              name="token-code"
              type="text"
              placeholder={t('auth.login.tokenCodePlaceholder')}
              required
            />
          </div>
        </CardContent>
      </form>
      <CardFooter>
        <Button onClick={handleSignInAsTotem} className="w-full" variant="outline" disabled={loading}>
          {loading ? t('auth.login.loggingIn') : t('auth.login.loginAsTotemButton')}
        </Button>
      </CardFooter>
    </Card>
  );
}
