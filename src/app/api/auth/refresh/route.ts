import { NextRequest, NextResponse } from 'next/server';

import { makeRefreshSessionController } from '@/core/application/controller-factories';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';

function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get('auth-token')?.value;
  if (cookie) return cookie;

  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);

  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const controller = makeRefreshSessionController();
  const result = await controller.handle(token, {
    ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
    userAgent: req.headers.get('user-agent') ?? 'unknown',
    deviceId: req.headers.get('x-device-id') ?? crypto.randomUUID(),
  });

  if (result.statusCode !== 200) {
    return toNextResponse(result);
  }

  const body = result.body as unknown as { token: string; user: Record<string, unknown> };

  const response = NextResponse.json({ user: body.user });

  response.cookies.set('auth-token', body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
