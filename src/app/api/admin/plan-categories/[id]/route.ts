import { NextRequest, NextResponse } from 'next/server';

import { updatePlanCategoryRequestSchema } from '@/core/communication/requests/plan-category';
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
      const data = parseWithZod(updatePlanCategoryRequestSchema, body);

      const existing = await prisma.planCategory.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.planCategory.findFirst({ where: { name: data.name } });
        if (duplicate) {
          return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
        }
      }

      const category = await prisma.planCategory.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          color: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { plans: { where: { deletedAt: null } } } },
        },
      });

      return NextResponse.json(category, { status: 200 });
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

    const existing = await prisma.planCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Unlink plans from this category before deleting
    await prisma.plan.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.planCategory.delete({ where: { id } });

    return NextResponse.json(null, { status: 204 });
  }),
);
