import { NextRequest, NextResponse } from 'next/server';

import { updateFeatureRequestSchema } from '@/core/communication/requests/feature';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const body = await req.json();
      const data = parseWithZod(updateFeatureRequestSchema, body);

      const existing = await prisma.feature.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
      }

      const feature = await prisma.feature.update({
        where: { id },
        data,
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { planFeatures: { where: { deletedAt: null } } } },
        },
      });

      return NextResponse.json(feature, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),
);

export const DELETE = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    const existing = await prisma.feature.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    await prisma.feature.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(null, { status: 204 });
  }),
);
