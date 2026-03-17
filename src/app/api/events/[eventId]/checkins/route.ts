import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

import { buildCheckInWhere, parseCheckInFilters } from './_lib/checkins-filters';

const registerAppCheckInSchema = z.object({
  eventParticipantId: z.string().min(1, 'Event participant ID is required.'),
  method: z.enum(['MANUAL', 'QR_CODE', 'FACE_RECOGNITION']).default('MANUAL'),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export const GET = withAuth(
  withRBAC(['CHECKIN_VIEW'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const filters = parseCheckInFilters(req.nextUrl.searchParams);
      const where = buildCheckInWhere(eventId, filters);

      const [total, rows, totemOptions] = await Promise.all([
        prisma.checkIn.count({ where }),
        prisma.checkIn.findMany({
          where,
          include: {
            eventParticipant: {
              include: {
                person: { select: { id: true, name: true, email: true } },
              },
            },
            totemEventSubscription: {
              include: {
                totemOrganizationSubscription: {
                  include: {
                    totem: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
          ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
          take: filters.pageSize + 1,
        }),
        prisma.totemEventSubscription.findMany({
          where: { eventId },
          select: {
            totemOrganizationSubscription: {
              select: {
                totem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          distinct: ['totemOrganizationSubscriptionId'],
        }),
      ]);

      const hasMore = rows.length > filters.pageSize;
      const pagedRows = hasMore ? rows.slice(0, filters.pageSize) : rows;
      const nextCursor = hasMore ? pagedRows[pagedRows.length - 1]?.id ?? null : null;

      const minCheckedAt = pagedRows[pagedRows.length - 1]?.checkedInAt;
      const maxCheckedAt = pagedRows[0]?.checkedInAt;

      const auditLogs = minCheckedAt && maxCheckedAt
        ? await prisma.auditLog.findMany({
            where: {
              eventId,
              action: 'CHECK_IN',
              createdAt: {
                gte: new Date(minCheckedAt.getTime() - 5 * 60 * 1000),
                lte: new Date(maxCheckedAt.getTime() + 5 * 60 * 1000),
              },
            },
            select: {
              id: true,
              metadata: true,
              sessionId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

      const items = pagedRows.map((checkIn) => {
        const source = checkIn.totemEventSubscriptionId ? 'TOTEM' : 'APP';

        const matchedAudit = auditLogs.find((log) => {
          const metadata = (log.metadata ?? null) as Record<string, unknown> | null;
          if (!metadata) return false;

          if (metadata.checkInId === checkIn.id) return true;
          if (metadata.eventParticipantId === checkIn.eventParticipantId) return true;

          return false;
        });

        return {
          id: checkIn.id,
          participant: {
            id: checkIn.eventParticipant.person.id,
            name: checkIn.eventParticipant.person.name,
            email: checkIn.eventParticipant.person.email,
          },
          method: checkIn.method,
          confidence: checkIn.confidence,
          source,
          totemName: checkIn.totemEventSubscription?.totemOrganizationSubscription.totem.name ?? null,
          locationName: checkIn.totemEventSubscription?.locationName ?? null,
          checkedInAt: checkIn.checkedInAt,
          handledBy: matchedAudit?.user?.name ?? (source === 'APP' ? 'System / App' : 'System / Totem'),
          sessionId: matchedAudit?.sessionId ?? null,
          rawMetadata: {
            checkIn: {
              id: checkIn.id,
              eventParticipantId: checkIn.eventParticipantId,
              totemEventSubscriptionId: checkIn.totemEventSubscriptionId,
              checkedInAt: checkIn.checkedInAt,
            },
            auditLogId: matchedAudit?.id ?? null,
            auditMetadata: matchedAudit?.metadata ?? null,
          },
        };
      });

      return NextResponse.json(
        {
          items,
          total,
          pageSize: filters.pageSize,
          nextCursor,
          hasMore,
          totemOptions: totemOptions.map((item) => ({
            id: item.totemOrganizationSubscription.totem.id,
            name: item.totemOrganizationSubscription.totem.name,
          })),
        },
        { status: 200 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list check-ins.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);

export const POST = withAuth(
  withRBAC(['CHECKIN_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const auth = getUserAuth(req);
      const body = await req.json();
      const data = registerAppCheckInSchema.parse(body);

      const participant = await prisma.eventParticipant.findFirst({
        where: {
          id: data.eventParticipantId,
          eventId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Participant not found for this event.' }, { status: 404 });
      }

      const existing = await prisma.checkIn.findFirst({
        where: {
          eventParticipantId: participant.id,
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json({ error: 'Participant already checked in.' }, { status: 409 });
      }

      const checkIn = await prisma.checkIn.create({
        data: {
          method: data.method,
          confidence: data.confidence ?? null,
          checkedInAt: new Date(),
          eventParticipantId: participant.id,
          totemEventSubscriptionId: null,
        },
      });

      const latestSession = await prisma.session.findFirst({
        where: {
          userId: auth.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CHECK_IN',
          description: 'Manual app check-in registered.',
          metadata: {
            source: 'APP',
            checkInId: checkIn.id,
            eventParticipantId: participant.id,
            method: checkIn.method,
          },
          eventId,
          organizationId: eventOrResponse.organizationId,
          userId: auth.userId,
          sessionId: latestSession?.id,
        },
      });

      return NextResponse.json(
        {
          id: checkIn.id,
          method: checkIn.method,
          confidence: checkIn.confidence,
          checkedInAt: checkIn.checkedInAt,
          source: 'APP',
        },
        { status: 201 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register app check-in.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);
