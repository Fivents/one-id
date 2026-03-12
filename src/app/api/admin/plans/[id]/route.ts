import { NextRequest, NextResponse } from 'next/server';

import { updatePlanRequestSchema } from '@/core/communication/requests/plan';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

const planSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  discount: true,
  isCustom: true,
  isActive: true,
  sortOrder: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, color: true } },
  _count: {
    select: {
      planFeatures: { where: { deletedAt: null } },
      subscriptions: true,
    },
  },
} as const;

export const GET = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    const plan = await prisma.plan.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...planSelect,
        planFeatures: {
          where: { deletedAt: null },
          select: {
            id: true,
            value: true,
            featureId: true,
            feature: { select: { id: true, code: true, name: true, type: true } },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan, { status: 200 });
  }),
);

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const body = await req.json();
      const data = parseWithZod(updatePlanRequestSchema, body);

      const existing = await prisma.plan.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const plan = await prisma.plan.update({
        where: { id },
        data,
        select: planSelect,
      });

      return NextResponse.json(plan, { status: 200 });
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

    const existing = await prisma.plan.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(null, { status: 204 });
  }),
);
