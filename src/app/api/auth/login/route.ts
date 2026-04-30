import { NextRequest, NextResponse } from 'next/server';

import { makeLoginController } from '@/core/application/controller-factories';
import { loginEmailRequestSchema } from '@/core/communication/requests/auth';
import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(loginEmailRequestSchema, body);

    const controller = makeLoginController();
    const result = await controller.handle(data, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      deviceId: request.headers.get('x-device-id') ?? crypto.randomUUID(),
    });

    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    const { token, user } = result.body as AuthTokenResponse;
    const response = NextResponse.json({ user });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
