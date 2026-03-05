import { NextRequest, NextResponse } from 'next/server';

import { makeLogoutController } from '@/core/application/controller-factories';
import { withAuth } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';

export const POST = withAuth(async (req: NextRequest) => {
  const auth = getUserAuth(req);

  const controller = makeLogoutController();
  const result = await controller.handle(auth.userId);

  if (result.statusCode !== 204) {
    return toNextResponse(result);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
});
