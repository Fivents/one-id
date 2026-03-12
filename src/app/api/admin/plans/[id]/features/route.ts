import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

const batchUpdateSchema = z.object({
  planId: z.string().uuid(),
  features: z.array(
    z.object({
      featureId: z.string().uuid(),
      value: z.string(),
    }),
  ),
});

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(batchUpdateSchema, body);

      const plan = await prisma.plan.findFirst({ where: { id: data.planId, deletedAt: null } });
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        // Soft-delete existing plan features
        await tx.planFeature.updateMany({
          where: { planId: data.planId, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        // Create new ones
        for (const f of data.features) {
          await tx.planFeature.upsert({
            where: { featureId_planId: { featureId: f.featureId, planId: data.planId } },
            update: { value: f.value, deletedAt: null },
            create: { featureId: f.featureId, planId: data.planId, value: f.value },
          });
        }
      });

      const planFeatures = await prisma.planFeature.findMany({
        where: { planId: data.planId, deletedAt: null },
        select: {
          id: true,
          value: true,
          featureId: true,
          feature: { select: { id: true, code: true, name: true, type: true } },
        },
      });

      return NextResponse.json(planFeatures, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),
);
