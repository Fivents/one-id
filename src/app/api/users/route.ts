import { NextRequest, NextResponse } from 'next/server';

import { makeCreateUserController, makeListUsersController } from '@/core/application/controller-factories';
import { createUserRequestSchema } from '@/core/communication/requests/user';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['USER_VIEW'], async () => {
    const controller = makeListUsersController();
    const result = await controller.handle();

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['USER_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createUserRequestSchema, body);

      const controller = makeCreateUserController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodValidationError') {
        return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
