import { NextRequest, NextResponse } from 'next/server';

import { createOrganizationRequestSchema } from '@/core/communication/requests/organization';
import type { AdminOrganizationResponse } from '@/core/communication/responses/admin-organizations';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async () => {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
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

    const result: AdminOrganizationResponse[] = organizations.map((org) => ({
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
    }));

    return NextResponse.json(result, { status: 200 });
  }),
);

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createOrganizationRequestSchema, body);

      const existing = await prisma.organization.findFirst({
        where: { slug: data.slug, deletedAt: null },
      });

      if (existing) {
        return NextResponse.json({ error: 'An organization with this slug already exists.' }, { status: 409 });
      }

      const org = await prisma.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          email: data.email ?? null,
          phone: data.phone ?? null,
          logoUrl: data.logoUrl ?? null,
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

      const result: AdminOrganizationResponse = {
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

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
