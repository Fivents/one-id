import { NextResponse } from 'next/server';

import { getGoogleOAuthProvider } from '@/infrastructure/container';

export async function GET() {
  try {
    const state = crypto.randomUUID();
    const provider = getGoogleOAuthProvider();
    const authUrl = provider.getAuthorizationUrl(state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('oauth-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=google_failed', process.env.NEXT_PUBLIC_APP_URL));
  }
}
