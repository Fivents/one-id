import { NextRequest, NextResponse } from 'next/server';

import { loginEmailRequestSchema } from '@/application/auth/communication/request/login-email.request';
import { LoginEmailError } from '@/application/auth/use-cases/login-with-email-client.use-case';
import { makeLoginWithEmailClientUseCase } from '@/infrastructure/container';
import { parseWithZod } from '@/lib/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(loginEmailRequestSchema, body);

    const useCase = makeLoginWithEmailClientUseCase();

    const result = await useCase.execute(data, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      deviceId: request.headers.get('x-device-id') ?? crypto.randomUUID(),
    });

    const response = NextResponse.json({ user: result.user });

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    });

    return response;
  } catch (error) {
    if (error instanceof LoginEmailError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.name === 'ZodValidationError') {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
