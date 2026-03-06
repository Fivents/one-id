import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeleteAdminTotemController,
  makeUpdateAdminTotemController,
} from '@/core/application/controller-factories';
import { updateAdminTotemRequestSchema } from '@/core/communication/requests/admin-totems';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateAdminTotemRequestSchema, body);

      const controller = makeUpdateAdminTotemController();
      const result = await controller.handle(id, data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

export const DELETE = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const controller = makeDeleteAdminTotemController();
      const result = await controller.handle(id);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
