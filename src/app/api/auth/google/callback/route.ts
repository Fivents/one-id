import { NextRequest, NextResponse } from 'next/server';

import { makeGoogleLoginController } from '@/core/application/controller-factories';
import type { AuthTokenResponse } from '@/core/communication/responses/auth';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('oauth-state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl));
  }

  const controller = makeGoogleLoginController();
  const result = await controller.handle(code, {
    ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    deviceId: request.headers.get('x-device-id') ?? crypto.randomUUID(),
  });

  if (result.statusCode !== 200) {
    const body = result.body as { error: string };
    const errorParam = body.error?.includes('domain') ? 'google_domain_invalid' : 'google_auth_failed';
    return NextResponse.redirect(new URL(`/login?error=${errorParam}`, baseUrl));
  }

  const { token } = result.body as AuthTokenResponse;
  const response = NextResponse.redirect(new URL('/dashboard', baseUrl));

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  response.cookies.delete('oauth-state');

  return response;
}
