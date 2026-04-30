import { NextRequest, NextResponse } from 'next/server';

import { makeCreateAdminTotemController, makeListAdminTotemsController } from '@/core/application/controller-factories';
import { createAdminTotemRequestSchema } from '@/core/communication/requests/admin-totems';
import type { AdminTotemResponse, TotemSubscriptionInfo } from '@/core/communication/responses/admin-totems';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async () => {
    const controller = makeListAdminTotemsController();
    const result = await controller.handle();

    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    // Enrich with subscription data
    const totems = result.body as Array<Record<string, unknown>>;
    const totemIds = totems.map((t) => t.id as string);

    // Fetch active subscriptions
    const subscriptions = await prisma.totemOrganizationSubscription.findMany({
      where: {
        totemId: { in: totemIds },
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      select: {
        id: true,
        totemId: true,
        organizationId: true,
        startsAt: true,
        endsAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const subscriptionIds = subscriptions.map((subscription) => subscription.id);

    const activeEventSubscriptions = subscriptionIds.length
      ? await prisma.totemEventSubscription.findMany({
          where: {
            totemOrganizationSubscriptionId: { in: subscriptionIds },
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
          select: {
            id: true,
            eventId: true,
            totemOrganizationSubscriptionId: true,
            locationName: true,
            startsAt: true,
            endsAt: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    // Fetch active sessions
    const sessions = await prisma.totemSession.findMany({
      where: {
        totemId: { in: totemIds },
        expiresAt: { gte: new Date() },
      },
      select: {
        totemId: true,
      },
    });

    const subscriptionMap = new Map<string, TotemSubscriptionInfo>();
    subscriptions.forEach((sub) => {
      subscriptionMap.set(sub.totemId, {
        id: sub.id,
        organizationId: sub.organizationId,
        organizationName: sub.organization.name,
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
      });
    });

    const eventSubscriptionMap = new Map(
      activeEventSubscriptions.map((eventSubscription) => [
        eventSubscription.totemOrganizationSubscriptionId,
        {
          id: eventSubscription.id,
          eventId: eventSubscription.eventId,
          eventName: eventSubscription.event.name,
          locationName: eventSubscription.locationName,
          startsAt: eventSubscription.startsAt,
          endsAt: eventSubscription.endsAt,
        },
      ]),
    );

    const sessionSet = new Set(sessions.map((s) => s.totemId));

    const enrichedTotems: AdminTotemResponse[] = totems.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      accessCode: (t.accessCode as string | null) ?? null,
      status: t.status as AdminTotemResponse['status'],
      price: t.price as number,
      discount: t.discount as number,
      lastHeartbeat: t.lastHeartbeat as Date | null,
      createdAt: t.createdAt as Date,
      updatedAt: t.updatedAt as Date,
      deletedAt: t.deletedAt as Date | null,
      currentSubscription: subscriptionMap.get(t.id as string) || null,
      currentEvent: subscriptionMap.get(t.id as string)
        ? (eventSubscriptionMap.get(subscriptionMap.get(t.id as string)!.id) ?? null)
        : null,
      isAvailable: !subscriptionMap.has(t.id as string),
      hasActiveSession: sessionSet.has(t.id as string),
    }));

    return NextResponse.json(enrichedTotems, { status: 200 });
  }),
);

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createAdminTotemRequestSchema, body);

      const controller = makeCreateAdminTotemController();
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
