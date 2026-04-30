import { NextRequest, NextResponse } from 'next/server';

import { makeCreateClientUserController } from '@/core/application/controller-factories';
import { createClientUserRequestSchema } from '@/core/communication/requests/admin';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const org = await prisma.organization.findUnique({ where: { id, deletedAt: null } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      const body = await req.json();
      const data = parseWithZod(createClientUserRequestSchema, {
        ...body,
        organizationId: id,
      });

      const controller = makeCreateClientUserController();
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
