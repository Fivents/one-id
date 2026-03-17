import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';
import { buildCheckInWhere, parseCheckInFilters } from '../_lib/checkins-filters';

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

      const [
        total,
        faceCount,
        qrCount,
        manualCount,
        confidenceAgg,
        totemUsage,
      ] = await Promise.all([
        prisma.checkIn.count({ where }),
        prisma.checkIn.count({ where: { ...where, method: 'FACE_RECOGNITION' } }),
        prisma.checkIn.count({ where: { ...where, method: 'QR_CODE' } }),
        prisma.checkIn.count({ where: { ...where, method: 'MANUAL' } }),
        prisma.checkIn.aggregate({ where, _avg: { confidence: true } }),
        prisma.checkIn.groupBy({
          by: ['totemEventSubscriptionId'],
          where,
          _count: { id: true },
          orderBy: { _count: { totemEventSubscriptionId: 'desc' } },
          take: 5,
        }),
      ]);

      const usageWithNames = await Promise.all(
        totemUsage
          .filter((item) => item.totemEventSubscriptionId)
          .map(async (item) => {
            const subscription = await prisma.totemEventSubscription.findUnique({
              where: { id: item.totemEventSubscriptionId! },
              select: {
                id: true,
                locationName: true,
                totemOrganizationSubscription: {
                  select: {
                    totem: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            });

            return {
              totemId: subscription?.totemOrganizationSubscription.totem.id ?? null,
              totemName: subscription?.totemOrganizationSubscription.totem.name ?? 'Unknown',
              locationName: subscription?.locationName ?? '—',
              count: item._count.id,
            };
          }),
      );

      return NextResponse.json(
        {
          total,
          faceCount,
          qrCount,
          manualCount,
          facePercentage: total > 0 ? Math.round((faceCount / total) * 100) : 0,
          qrPercentage: total > 0 ? Math.round((qrCount / total) * 100) : 0,
          manualPercentage: total > 0 ? Math.round((manualCount / total) * 100) : 0,
          averageConfidence: confidenceAgg._avg?.confidence ?? null,
          totemUsage: usageWithNames,
        },
        { status: 200 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compute check-in stats.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);
