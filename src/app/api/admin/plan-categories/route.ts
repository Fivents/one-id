import { NextRequest, NextResponse } from 'next/server';

import { createPlanCategoryRequestSchema } from '@/core/communication/requests/plan-category';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async () => {
    const categories = await prisma.planCategory.findMany({
      orderBy: { sortOrder: 'asc' },
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

    return NextResponse.json(categories, { status: 200 });
  }),
);

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createPlanCategoryRequestSchema, body);

      const existing = await prisma.planCategory.findFirst({ where: { name: data.name } });
      if (existing) {
        return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
      }

      const category = await prisma.planCategory.create({
        data: {
          name: data.name,
          color: data.color,
          sortOrder: data.sortOrder,
        },
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

      return NextResponse.json(category, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),
);
