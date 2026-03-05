import { NextRequest, NextResponse } from 'next/server';

import { loginAccessCodeRequestSchema } from '@/core/communication/requests/auth';
import { AppError } from '@/core/errors';
import { makeLoginWithAccessCodeTotemUseCase } from '@/core/infrastructure/factories';
import { parseWithZod } from '@/core/utils/parse-with-zod';

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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
