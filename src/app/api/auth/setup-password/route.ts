import { NextRequest, NextResponse } from 'next/server';

import { setupPasswordRequestSchema } from '@/core/communication/requests/auth';
import { AppError } from '@/core/errors';
import { makeSetupClientPasswordUseCase } from '@/core/infrastructure/factories';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(setupPasswordRequestSchema, body);

    const useCase = makeSetupClientPasswordUseCase();
    await useCase.execute(data.token, data.password);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
