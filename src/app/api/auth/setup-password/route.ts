import { NextRequest, NextResponse } from 'next/server';

import { SetupPasswordError } from '@/core/application/use-cases/auth/setup-client-password.use-case';
import { setupPasswordRequestSchema } from '@/core/communication/requests/auth';
import { makeSetupClientPasswordUseCase } from '@/core/infrastructure/database/container';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(setupPasswordRequestSchema, body);

    const useCase = makeSetupClientPasswordUseCase();
    await useCase.execute(data.token, data.password);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SetupPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.name === 'ZodValidationError') {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    // jose verification errors
    if (error instanceof Error && error.message.includes('JW')) {
      return NextResponse.json({ error: 'Invalid or expired setup token.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
