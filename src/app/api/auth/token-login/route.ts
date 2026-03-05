import { NextRequest, NextResponse } from 'next/server';

import { makeTotemLoginController } from '@/core/application/controller-factories';
import { loginAccessCodeRequestSchema } from '@/core/communication/requests/auth';
import { AppError } from '@/core/errors';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(loginAccessCodeRequestSchema, body);

    const controller = makeTotemLoginController();
    const result = await controller.handle(data.accessCode, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    return toNextResponse(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
