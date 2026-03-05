import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeleteUserController,
  makeGetUserController,
  makeUpdateUserController,
} from '@/core/application/controller-factories';
import { updateUserRequestSchema } from '@/core/communication/requests/user';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['USER_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { userId } = await context.params;

    const controller = makeGetUserController();
    const result = await controller.handle(userId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['USER_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { userId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateUserRequestSchema, body);

      const controller = makeUpdateUserController();
      const result = await controller.handle(userId, data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodValidationError') {
        return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

export const DELETE = withAuth(
  withRBAC(['USER_DELETE'], async (_req: NextRequest, context: RouteContext) => {
    const { userId } = await context.params;

    const controller = makeDeleteUserController();
    const result = await controller.handle(userId);

    return toNextResponse(result);
  }),
);
