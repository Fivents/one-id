import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { assertOrganizationAccess } from '@/app/api/organizations/_lib/access';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

const assignToEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required.'),
  locationName: z.string().min(1, 'Location name is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const POST = withAuth(
  withRBAC(['TOTEM_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const auth = getUserAuth(req);
      const { totemId } = await context.params;

      if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ORG_OWNER' && auth.role !== 'EVENT_MANAGER') {
        return NextResponse.json(
          { error: 'Forbidden. Insufficient role for totem-event assignment.' },
          { status: 403 },
        );
      }

      const body = await req.json();
      const data = assignToEventSchema.parse(body);

      if (data.startsAt >= data.endsAt) {
        return NextResponse.json({ error: 'Start date must be before end date.' }, { status: 400 });
      }

      const now = new Date();

      const activeOrgSubscription = await prisma.totemOrganizationSubscription.findFirst({
        where: {
          totemId,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!activeOrgSubscription) {
        return NextResponse.json({ error: 'Totem is not actively assigned to an organization.' }, { status: 409 });
      }

      const accessError = await assertOrganizationAccess(req, activeOrgSubscription.organizationId);
      if (accessError) {
        return accessError;
      }

      const event = await prisma.event.findUnique({
        where: { id: data.eventId, deletedAt: null },
        select: { id: true, name: true, organizationId: true },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      if (event.organizationId !== activeOrgSubscription.organizationId) {
        return NextResponse.json(
          { error: 'Event must belong to the same organization as the totem assignment.' },
          { status: 409 },
        );
      }

      const activeEventAssignment = await prisma.totemEventSubscription.findFirst({
        where: {
          totemOrganizationSubscription: {
            totemId,
          },
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        select: { id: true },
      });

      if (activeEventAssignment) {
        return NextResponse.json({ error: 'Totem already has an active event assignment.' }, { status: 409 });
      }

      const created = await prisma.totemEventSubscription.create({
        data: {
          locationName: data.locationName,
          totemOrganizationSubscriptionId: activeOrgSubscription.id,
          eventId: data.eventId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
        },
        include: {
          event: {
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
          eventId: created.eventId,
          eventName: created.event.name,
          locationName: created.locationName,
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
