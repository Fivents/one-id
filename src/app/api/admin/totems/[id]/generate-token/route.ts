import { NextRequest, NextResponse } from 'next/server';

import { makeGenerateTotemAccessTokenController } from '@/core/application/controller-factories';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';

export const POST = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const controller = makeGenerateTotemAccessTokenController();
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
