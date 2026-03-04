import { NextRequest, NextResponse } from 'next/server';

import { AdminDomainError } from '@/core/application/services/admin-domain.service';
import { GoogleAdminLoginError } from '@/core/application/use-cases/auth/login-with-google-admin.use-case';
import { makeLoginWithGoogleAdminUseCase } from '@/core/infrastructure/factories';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const storedState = request.cookies.get('oauth-state')?.value;

    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl));
    }

    const useCase = makeLoginWithGoogleAdminUseCase();

    const result = await useCase.execute(code, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      deviceId: request.headers.get('x-device-id') ?? crypto.randomUUID(),
    });

    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    response.cookies.delete('oauth-state');

    return response;
  } catch (error) {
    if (error instanceof AdminDomainError) {
      return NextResponse.redirect(new URL('/login?error=google_domain_invalid', baseUrl));
    }

    if (error instanceof GoogleAdminLoginError) {
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', baseUrl));
    }

    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl));
  }
}
