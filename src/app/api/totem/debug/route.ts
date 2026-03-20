import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/core/infrastructure/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body as { key?: string };

    if (!key) {
      return NextResponse.json({ error: 'Access code is required.' }, { status: 400 });
    }

    const now = new Date();

    // Step 1: Find totem
    const totem = await prisma.totem.findFirst({
      where: { accessCode: key }
    });

    if (!totem) {
      return NextResponse.json({
        success: false,
        step: 1,
        message: 'Totem not found',
        debug: {
          accessCode: key,
          found: false
        }
      }, { status: 200 });
    }

    // Step 2: Check totem status
    if (totem.deletedAt) {
      return NextResponse.json({
        success: false,
        step: 2,
        message: 'Totem is deleted',
        debug: {
          totemId: totem.id,
          totemName: totem.name,
          status: totem.status,
          deletedAt: totem.deletedAt
        }
      }, { status: 200 });
    }

    if (totem.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        step: 3,
        message: 'Totem is not active',
        debug: {
          totemId: totem.id,
          totemName: totem.name,
          status: totem.status
        }
      }, { status: 200 });
    }

    // Step 3: Check organization subscriptions
    const orgSubs = await prisma.totemOrganizationSubscription.findMany({
      where: { totemId: totem.id },
      select: {
        id: true,
        organizationId: true,
        startsAt: true,
        endsAt: true,
        revokedAt: true,
        organization: { select: { name: true } }
      }
    });

    if (orgSubs.length === 0) {
      return NextResponse.json({
        success: false,
        step: 4,
        message: 'No organization subscriptions found',
        debug: {
          totemId: totem.id,
          totemName: totem.name
        }
      }, { status: 200 });
    }

    // Find active org subscriptions
    const activeOrgSubs = orgSubs.filter(
      sub => sub.startsAt <= now && sub.endsAt >= now && !sub.revokedAt
    );

    if (activeOrgSubs.length === 0) {
      return NextResponse.json({
        success: false,
        step: 5,
        message: 'No active organization subscriptions',
        debug: {
          totemId: totem.id,
          totemName: totem.name,
          subscriptions: orgSubs.map(sub => ({
            org: sub.organization.name,
            startsAt: sub.startsAt.toISOString(),
            endsAt: sub.endsAt.toISOString(),
            revokedAt: sub.revokedAt?.toISOString() || null,
            isActive: sub.startsAt <= now && sub.endsAt >= now && !sub.revokedAt
          })),
          currentTime: now.toISOString()
        }
      }, { status: 200 });
    }

    // Step 4: Check event subscriptions for each active org
    let foundActiveEvent = false;
    const eventDetails: any[] = [];

    for (const orgSub of activeOrgSubs) {
      const eventSubs = await prisma.totemEventSubscription.findMany({
        where: { totemOrganizationSubscriptionId: orgSub.id },
        select: {
          id: true,
          eventId: true,
          startsAt: true,
          endsAt: true,
          revokedAt: true,
          event: {
            select: {
              name: true,
              status: true,
              startsAt: true,
              endsAt: true,
              deletedAt: true
            }
          }
        }
      });

      for (const eventSub of eventSubs) {
        const isSubActive = eventSub.startsAt <= now && eventSub.endsAt >= now && !eventSub.revokedAt;
        const isEventActive = eventSub.event.status === 'ACTIVE' &&
          eventSub.event.startsAt <= now &&
          eventSub.event.endsAt >= now &&
          !eventSub.event.deletedAt;

        eventDetails.push({
          org: orgSub.organization.name,
          event: eventSub.event.name,
          eventStatus: eventSub.event.status,
          subStartsAt: eventSub.startsAt.toISOString(),
          subEndsAt: eventSub.endsAt.toISOString(),
          subRevokedAt: eventSub.revokedAt?.toISOString() || null,
          eventStartsAt: eventSub.event.startsAt.toISOString(),
          eventEndsAt: eventSub.event.endsAt.toISOString(),
          subActive: isSubActive,
          eventActive: isEventActive,
          fullyActive: isSubActive && isEventActive
        });

        if (isSubActive && isEventActive) {
          foundActiveEvent = true;
        }
      }
    }

    if (!foundActiveEvent) {
      return NextResponse.json({
        success: false,
        step: 6,
        message: 'No active event found',
        debug: {
          totemId: totem.id,
          totemName: totem.name,
          currentTime: now.toISOString(),
          events: eventDetails
        }
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'Totem is properly configured',
      debug: {
        totemId: totem.id,
        totemName: totem.name,
        status: totem.status,
        events: eventDetails
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
