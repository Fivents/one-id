import { NextRequest, NextResponse } from 'next/server';

import { updateGatePolicyRequestSchema } from '@/core/communication/requests/event';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedEvent } from '../../../_lib/access';

/**
 * Sets which sectors and ticket types a gate accepts.
 *
 * Event-scoped rather than totem-scoped: the restriction belongs to this totem *at this event*,
 * so it cannot follow the device to the next one.
 */
export const PATCH = withAuth(
  withRBAC(['TOTEM_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId, subscriptionId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(updateGatePolicyRequestSchema, body);

      // Scoped to the event from the URL: without this, a valid subscription id from another
      // organization's event would be editable by anyone who can manage this one.
      const subscription = await prisma.totemEventSubscription.findFirst({
        where: { id: subscriptionId, eventId },
        select: { id: true },
      });

      if (!subscription) {
        return NextResponse.json({ error: 'Gate not found for this event.' }, { status: 404 });
      }

      const updated = await prisma.totemEventSubscription.update({
        where: { id: subscription.id },
        data: {
          // An empty list means "no restriction", stored as SQL NULL rather than [] so the column
          // has one representation for one meaning. Prisma needs DbNull spelled out on a Json
          // column: a plain null would mean "leave it alone".
          allowedSectors: data.allowedSectors.length > 0 ? data.allowedSectors : Prisma.DbNull,
          allowedTicketTypes:
            data.allowedTicketTypes.length > 0 ? data.allowedTicketTypes : Prisma.DbNull,
        },
        select: { id: true, locationName: true, allowedSectors: true, allowedTicketTypes: true },
      });

      const auth = getUserAuth(req);

      await prisma.auditLog.create({
        data: {
          action: 'TOTEM_UPDATED',
          description: `Restrição de portaria atualizada para "${updated.locationName}".`,
          organizationId: eventOrResponse.organizationId,
          eventId,
          userId: auth.userId,
          metadata: {
            totemEventSubscriptionId: updated.id,
            allowedSectors: data.allowedSectors,
            allowedTicketTypes: data.allowedTicketTypes,
          },
        },
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
