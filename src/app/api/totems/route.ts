import { NextRequest, NextResponse } from 'next/server';

import { makeCreateTotemController, makeListTotemsController } from '@/core/application/controller-factories';
import { createTotemRequestSchema } from '@/core/communication/requests/totem';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['TOTEM_VIEW'], async () => {
    const controller = makeListTotemsController();
    const result = await controller.handle();

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['TOTEM_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createTotemRequestSchema, body);

      const controller = makeCreateTotemController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
