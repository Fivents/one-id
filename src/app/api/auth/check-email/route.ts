import { NextRequest, NextResponse } from 'next/server';

import { checkEmailRequestSchema } from '@/application/auth/communication/request/check-email.request';
import { CheckEmailError } from '@/application/auth/use-cases/check-email-client.use-case';
import { makeCheckEmailClientUseCase } from '@/infrastructure/container';
import { parseWithZod } from '@/lib/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(checkEmailRequestSchema, body);

    const useCase = makeCheckEmailClientUseCase();
    const result = await useCase.execute(data.email);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CheckEmailError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof Error && error.name === 'ZodValidationError') {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
