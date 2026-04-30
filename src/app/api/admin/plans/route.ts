import { NextRequest, NextResponse } from 'next/server';

import { createPlanRequestSchema } from '@/core/communication/requests/plan';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async () => {
    const plans = await prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: {
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
      },
    });

    return NextResponse.json(plans, { status: 200 });
  }),
);

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createPlanRequestSchema, body);

      const plan = await prisma.plan.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          discount: data.discount,
          isCustom: data.isCustom,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          categoryId: data.categoryId ?? null,
        },
        select: {
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
        },
      });

      return NextResponse.json(plan, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),
);
