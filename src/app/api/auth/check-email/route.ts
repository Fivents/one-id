import { NextRequest, NextResponse } from 'next/server';

import { checkEmailRequestSchema } from '@/core/communication/requests/auth';
import { AppError } from '@/core/errors';
import { makeCheckEmailClientUseCase } from '@/core/infrastructure/factories';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(checkEmailRequestSchema, body);

    const useCase = makeCheckEmailClientUseCase();
    const result = await useCase.execute(data.email);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
