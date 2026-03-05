import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeleteTotemController,
  makeGetTotemController,
  makeUpdateTotemController,
} from '@/core/application/controller-factories';
import { updateTotemRequestSchema } from '@/core/communication/requests/totem';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['TOTEM_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { totemId } = await context.params;

    const controller = makeGetTotemController();
    const result = await controller.handle(totemId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['TOTEM_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { totemId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateTotemRequestSchema, body);

      const controller = makeUpdateTotemController();
      const result = await controller.handle(totemId, data);

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
  withRBAC(['TOTEM_DELETE'], async (_req: NextRequest, context: RouteContext) => {
    const { totemId } = await context.params;

    const controller = makeDeleteTotemController();
    const result = await controller.handle(totemId);

    return toNextResponse(result);
  }),
);
