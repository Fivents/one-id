import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

const assignToOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { totemId } = await context.params;
      const body = await req.json();
      const data = assignToOrganizationSchema.parse(body);

      if (data.startsAt >= data.endsAt) {
        return NextResponse.json({ error: 'Start date must be before end date.' }, { status: 400 });
      }

      const now = new Date();

      const [totem, organization, activeOrgSubscription] = await Promise.all([
        prisma.totem.findUnique({ where: { id: totemId, deletedAt: null }, select: { id: true } }),
        prisma.organization.findUnique({ where: { id: data.organizationId, deletedAt: null }, select: { id: true } }),
        prisma.totemOrganizationSubscription.findFirst({
          where: {
            totemId,
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
          select: { id: true },
        }),
      ]);

      if (!totem) {
        return NextResponse.json({ error: 'Totem not found.' }, { status: 404 });
      }

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
      }

      if (activeOrgSubscription) {
        return NextResponse.json({ error: 'Totem already has an active organization assignment.' }, { status: 409 });
      }

      const created = await prisma.totemOrganizationSubscription.create({
        data: {
          totemId,
          organizationId: data.organizationId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          id: created.id,
          totemId,
          organizationId: created.organizationId,
          organizationName: created.organization.name,
          startsAt: created.startsAt,
          endsAt: created.endsAt,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);
