import { NextRequest, NextResponse } from 'next/server';

import { loginAccessCodeRequestSchema } from '@/application/auth/communication/request/login-access-code.request';
import { TotemLoginError } from '@/application/auth/use-cases/login-with-access-code-totem.use-case';
import { makeLoginWithAccessCodeTotemUseCase } from '@/infrastructure/container';
import { parseWithZod } from '@/lib/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(loginAccessCodeRequestSchema, body);

    const useCase = makeLoginWithAccessCodeTotemUseCase();

    const result = await useCase.execute(data.accessCode, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    // Totem receives token in response body (device auth, not browser cookie)
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TotemLoginError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.name === 'ZodValidationError') {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
