import { NextRequest, NextResponse } from 'next/server';

import { updateOrganizationRequestSchema } from '@/core/communication/requests/organization';
import type { AdminOrganizationDetailResponse } from '@/core/communication/responses/admin-organizations';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true } },
          },
        },
        memberships: {
          where: { deletedAt: null },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            events: true,
            memberships: { where: { deletedAt: null } },
            people: { where: { deletedAt: null } },
            totemOrganizationSubscriptions: {
              where: {
                startsAt: { lte: new Date() },
                endsAt: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    const result: AdminOrganizationDetailResponse = {
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
      members: org.memberships.map((m) => ({
        id: m.id,
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
        createdAt: m.createdAt,
      })),
      _count: {
        events: org._count.events,
        members: org._count.memberships,
        participants: org._count.people,
        totems: org._count.totemOrganizationSubscriptions,
      },
    };

    return NextResponse.json(result, { status: 200 });
  }),
);

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateOrganizationRequestSchema, body);

      const existing = await prisma.organization.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      const org = await prisma.organization.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          logoUrl: data.logoUrl,
          isActive: data.isActive,
        },
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

export const DELETE = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const existing = await prisma.organization.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      await prisma.organization.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
