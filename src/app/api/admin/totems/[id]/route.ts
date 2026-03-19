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
import { prisma } from '@/core/infrastructure/prisma-client';
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
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const now = new Date();
      const forceDelete = req.nextUrl.searchParams.get('force') === 'true';

      const activeOrganizationSubscriptions = await prisma.totemOrganizationSubscription.findMany({
        where: {
          totemId: id,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        select: { id: true },
      });

      if (activeOrganizationSubscriptions.length > 0 && !forceDelete) {
        return NextResponse.json(
          {
            error:
              'This totem is currently assigned to an organization. Deleting it will remove all active assignments. Do you want to continue?',
            code: 'TOTEM_ACTIVE_ASSIGNMENT_CONFIRMATION_REQUIRED',
          },
          { status: 409 },
        );
      }

      if (activeOrganizationSubscriptions.length > 0) {
        const activeOrganizationSubscriptionIds = activeOrganizationSubscriptions.map(
          (subscription) => subscription.id,
        );

        await prisma.$transaction([
          prisma.totemEventSubscription.updateMany({
            where: {
              totemOrganizationSubscriptionId: { in: activeOrganizationSubscriptionIds },
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
            data: {
              endsAt: now,
              revokedAt: now,
              revokedReason: 'TOTEM_DELETED',
            },
          }),
          prisma.totemOrganizationSubscription.updateMany({
            where: {
              id: { in: activeOrganizationSubscriptionIds },
            },
            data: {
              endsAt: now,
              revokedAt: now,
              revokedReason: 'TOTEM_DELETED',
            },
          }),
        ]);
      }

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
