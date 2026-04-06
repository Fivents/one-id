import { NextRequest, NextResponse } from 'next/server';

import { makeSetupPasswordController } from '@/core/application/controller-factories';
import { setupPasswordRequestSchema } from '@/core/communication/requests/auth';
import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(setupPasswordRequestSchema, body);

    const controller = makeSetupPasswordController();
    const result = await controller.handle(data.token, data.password, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      deviceId: request.headers.get('x-device-id') ?? crypto.randomUUID(),
    });

    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    // Set auth cookie and return user data (same pattern as login route)
    const { token, user } = result.body as AuthTokenResponse;
    const response = NextResponse.json({ user });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
