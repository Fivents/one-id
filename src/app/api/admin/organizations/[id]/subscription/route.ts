import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const { planId, startedAt, expiresAt } = body;

      if (!planId || !startedAt || !expiresAt) {
        return NextResponse.json({ error: 'planId, startedAt and expiresAt are required.' }, { status: 400 });
      }

      const org = await prisma.organization.findUnique({ where: { id, deletedAt: null } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId, deletedAt: null, isActive: true } });
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found or inactive.' }, { status: 404 });
      }

      const existingSub = await prisma.subscription.findUnique({ where: { organizationId: id } });

      let subscription;
      if (existingSub) {
        subscription = await prisma.subscription.update({
          where: { organizationId: id },
          data: { planId, startedAt: new Date(startedAt), expiresAt: new Date(expiresAt) },
          include: { plan: { select: { id: true, name: true } } },
        });
      } else {
        subscription = await prisma.subscription.create({
          data: {
            organizationId: id,
            planId,
            startedAt: new Date(startedAt),
            expiresAt: new Date(expiresAt),
          },
          include: { plan: { select: { id: true, name: true } } },
        });
      }

      return NextResponse.json(
        {
          id: subscription.id,
          planId: subscription.planId,
          planName: subscription.plan.name,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
        },
        { status: existingSub ? 200 : 201 },
      );
    } catch {
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
