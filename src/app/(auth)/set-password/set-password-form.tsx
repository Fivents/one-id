'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/core/application/client-services';
import { useAuth } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { refreshSession } = useAuth();

  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">{t('auth.setPassword.invalidToken')}</p>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password.length < 8) {
      setError(t('auth.setPassword.minLength'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.setPassword.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      const result = await authClient.setupPassword({ token: token!, password, confirmPassword });

      if (!result.success) {
        setError(result.error.message || t('auth.setPassword.invalidToken'));
        setLoading(false);
        return;
      }

      // Refresh session to load the user data into auth context
      await refreshSession();

      // Redirect directly to dashboard (user is now authenticated)
      router.push('/dashboard');
    } catch {
      setError(t('auth.login.connectionError'));
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <Image src="/png/logo-white.png" alt="Logo" width={32} height={32} />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.setPassword.title')}</CardTitle>
        <CardDescription>{t('auth.setPassword.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.setPassword.newPassword')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.setPassword.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.setPassword.saving') : t('common.actions.confirm')}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
