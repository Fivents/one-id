import { NextRequest, NextResponse } from 'next/server';

import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const { isActive } = body as { isActive: boolean };

      const existing = await prisma.organization.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      if (existing.isActive === isActive) {
        const status = isActive ? 'active' : 'inactive';
        return NextResponse.json({ error: `Organization is already ${status}.` }, { status: 409 });
      }

      const org = await prisma.organization.update({
        where: { id },
        data: { isActive },
        include: {
          subscription: {
            include: {
              plan: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              events: true,
              memberships: { where: { deletedAt: null } },
            },
          },
        },
      });

      const result = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        phone: org.phone,
        logoUrl: org.logoUrl,
        isActive: org.isActive,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        subscription: org.subscription
          ? {
              id: org.subscription.id,
              planId: org.subscription.planId,
              planName: org.subscription.plan.name,
              startedAt: org.subscription.startedAt,
              expiresAt: org.subscription.expiresAt,
            }
          : null,
        _count: {
          events: org._count.events,
          members: org._count.memberships,
        },
      };

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
