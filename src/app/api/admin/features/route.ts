import { NextRequest, NextResponse } from 'next/server';

import { createFeatureRequestSchema } from '@/core/communication/requests/feature';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async () => {
    const features = await prisma.feature.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
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

    return NextResponse.json(features, { status: 200 });
  }),
);

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createFeatureRequestSchema, body);

      const existing = await prisma.feature.findFirst({
        where: { code: data.code, deletedAt: null },
      });
      if (existing) {
        return NextResponse.json({ error: 'A feature with this code already exists.' }, { status: 409 });
      }

      const feature = await prisma.feature.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          description: data.description ?? null,
        },
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

      return NextResponse.json(feature, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),
);
