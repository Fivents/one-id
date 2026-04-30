import { NextRequest, NextResponse } from 'next/server';

import {
  makeCreateOrganizationController,
  makeListOrganizationsController,
} from '@/core/application/controller-factories';
import { createOrganizationRequestSchema } from '@/core/communication/requests/organization';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['ORGANIZATION_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    if (auth.role !== 'SUPER_ADMIN') {
      const memberships = await prisma.membership.findMany({
        where: {
          userId: auth.userId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
              phone: true,
              logoUrl: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return NextResponse.json(
        memberships.map((membership) => membership.organization),
        { status: 200 },
      );
    }

    const controller = makeListOrganizationsController();
    const result = await controller.handle();

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['ORGANIZATION_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createOrganizationRequestSchema, body);

      const controller = makeCreateOrganizationController();
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
