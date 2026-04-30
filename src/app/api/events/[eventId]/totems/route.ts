import { NextRequest, NextResponse } from 'next/server';

import { makeLinkTotemToEventController } from '@/core/application/controller-factories';
import { linkTotemToEventRequestSchema } from '@/core/communication/requests/totem-event-subscription';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['TOTEM_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(_req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const event = eventOrResponse;

    const assigned = await prisma.totemEventSubscription.findMany({
      where: { eventId },
      include: {
        totemOrganizationSubscription: {
          include: {
            totem: { select: { id: true, name: true, status: true, lastHeartbeat: true } },
          },
        },
      },
      orderBy: { startsAt: 'desc' },
    });

    const assignedRows = assigned.map((sub) => ({
      id: sub.id,
      totemOrganizationSubscriptionId: sub.totemOrganizationSubscriptionId,
      totemId: sub.totemOrganizationSubscription.totem.id,
      totemName: sub.totemOrganizationSubscription.totem.name,
      totemStatus: sub.totemOrganizationSubscription.totem.status,
      lastHeartbeat: sub.totemOrganizationSubscription.totem.lastHeartbeat,
      locationName: sub.locationName,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    }));

    const now = new Date();
    const assignedOrgSubIds = new Set(assigned.map((sub) => sub.totemOrganizationSubscriptionId));

    const availableSubs = await prisma.totemOrganizationSubscription.findMany({
      where: {
        organizationId: event.organizationId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        totem: { select: { id: true, name: true, status: true, lastHeartbeat: true } },
      },
      orderBy: { startsAt: 'desc' },
    });

    const available = availableSubs
      .filter((sub) => !assignedOrgSubIds.has(sub.id))
      .map((sub) => ({
        totemOrganizationSubscriptionId: sub.id,
        totemId: sub.totem.id,
        totemName: sub.totem.name,
        totemStatus: sub.totem.status,
        lastHeartbeat: sub.totem.lastHeartbeat,
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
      }));

    return NextResponse.json({ assigned: assignedRows, available }, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['TOTEM_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(linkTotemToEventRequestSchema, { ...body, eventId });

      const event = eventOrResponse;

      const orgSub = await prisma.totemOrganizationSubscription.findUnique({
        where: { id: data.totemOrganizationSubscriptionId },
        select: { organizationId: true },
      });

      if (!orgSub || orgSub.organizationId !== event.organizationId) {
        return NextResponse.json({ error: 'Totem subscription not found for this organization.' }, { status: 404 });
      }

      const controller = makeLinkTotemToEventController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
