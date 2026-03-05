'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/core/application/client-services';
import { useI18n } from '@/i18n';

import {
  type EmailStepData,
  emailStepSchema,
  type PasswordStepData,
  passwordStepSchema,
  type TotemAccessCodeData,
  totemAccessCodeSchema,
} from './login-schema';

type LoginStep = 'email' | 'password' | 'totem';

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

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [apiError, setApiError] = useState(urlErrorKey ? t(urlErrorKey) : '');

  const emailForm = useForm<EmailStepData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordStepData>({
    resolver: zodResolver(passwordStepSchema),
    defaultValues: { password: '' },
  });

  const totemForm = useForm<TotemAccessCodeData>({
    resolver: zodResolver(totemAccessCodeSchema),
    defaultValues: { accessCode: '' },
  });

  async function handleCheckEmail(data: EmailStepData) {
    setApiError('');

    const result = await authClient.checkEmail({ email: data.email });

    if (!result.success) {
      setApiError(result.error.message);
      return;
    }

    if (result.data.status === 'needs_setup') {
      router.push(`/set-password?token=${result.data.setupToken}`);
      return;
    }

    setEmail(data.email);
    setStep('password');
  }

  async function handlePasswordSubmit(data: PasswordStepData) {
    setApiError('');

    const result = await authClient.loginWithEmail({ email, password: data.password });

    if (!result.success) {
      setApiError(result.error.message);
      return;
    }

    router.push('/dashboard');
  }

  async function handleTotemSubmit(data: TotemAccessCodeData) {
    setApiError('');

    const result = await authClient.tokenLogin({ accessCode: data.accessCode });

    if (!result.success) {
      setApiError(result.error.message);
      return;
    }

    router.push('/dashboard');
  }

  function handleBackToEmail() {
    setStep('email');
    setEmail('');
    setApiError('');
    passwordForm.reset();
  }

  const isSubmitting =
    emailForm.formState.isSubmitting || passwordForm.formState.isSubmitting || totemForm.formState.isSubmitting;

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
        {apiError && (
          <div role="alert" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {apiError}
          </div>
        )}

        {/* ── Google OAuth (Admin only) ───────────────────── */}
        {step !== 'totem' && (
          <>
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
          </>
        )}
      </CardContent>

      {/* ── Step 1: Email Check (Client) ─────────────────── */}
      {step === 'email' && (
        <form onSubmit={emailForm.handleSubmit(handleCheckEmail)}>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                autoComplete="email"
                aria-invalid={!!emailForm.formState.errors.email}
                aria-describedby={emailForm.formState.errors.email ? 'email-error' : undefined}
                {...emailForm.register('email')}
              />
              {emailForm.formState.errors.email && (
                <p id="email-error" className="text-destructive text-sm">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {emailForm.formState.isSubmitting ? t('auth.login.loggingIn') : t('common.actions.next')}
            </Button>
          </CardContent>
        </form>
      )}

      {/* ── Step 2: Password (Client) ────────────────────── */}
      {step === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
          <CardContent className="space-y-4 pt-0">
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{t('auth.login.emailLabel')}: </span>
              <span className="font-medium">{email}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
                aria-invalid={!!passwordForm.formState.errors.password}
                aria-describedby={passwordForm.formState.errors.password ? 'password-error' : undefined}
                {...passwordForm.register('password')}
              />
              {passwordForm.formState.errors.password && (
                <p id="password-error" className="text-destructive text-sm">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {passwordForm.formState.isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={handleBackToEmail}>
              {t('common.actions.back')}
            </Button>
          </CardContent>
        </form>
      )}

      {/* ── Separator: Totem Access Code ─────────────────── */}
      {step !== 'totem' && (
        <CardContent className="pt-0">
          <div className="relative">
            <Separator />
            <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              {t('common.actions.or')}
            </span>
          </div>
        </CardContent>
      )}

      {/* ── Totem Access Code ────────────────────────────── */}
      {step === 'totem' ? (
        <form onSubmit={totemForm.handleSubmit(handleTotemSubmit)}>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="access-code">{t('auth.login.tokenCodeLabel')}</Label>
              <Input
                id="access-code"
                type="text"
                placeholder={t('auth.login.tokenCodePlaceholder')}
                autoFocus
                aria-invalid={!!totemForm.formState.errors.accessCode}
                aria-describedby={totemForm.formState.errors.accessCode ? 'access-code-error' : undefined}
                {...totemForm.register('accessCode')}
              />
              {totemForm.formState.errors.accessCode && (
                <p id="access-code-error" className="text-destructive text-sm">
                  {totemForm.formState.errors.accessCode.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {totemForm.formState.isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('email');
                setApiError('');
                totemForm.reset();
              }}
            >
              {t('common.actions.back')}
            </Button>
          </CardContent>
        </form>
      ) : (
        <CardFooter>
          <Button
            onClick={() => {
              setStep('totem');
              setApiError('');
            }}
            className="w-full"
            variant="outline"
            disabled={isSubmitting}
          >
            {t('auth.login.loginAsTotemButton')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
