import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withSuperAdmin } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { assertOrganizationAccess } from '../../../events/_lib/access';

// ── GET /api/admin/email-settings/logs ───────────────────
// Paginated list of global email send history.

export const GET = withAuth(
  withSuperAdmin(async (req: NextRequest, _context: RouteContext) => {

    const page = Math.max(Number(req.nextUrl.searchParams.get('page') ?? '1') || 1, 1);
    const pageSizeRaw = Number(req.nextUrl.searchParams.get('pageSize') ?? '20') || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
    const eventId = req.nextUrl.searchParams.get('eventId') ?? undefined;
    const status = req.nextUrl.searchParams.get('status') ?? undefined;

    const where = {
      ...(eventId ? { eventId } : {}),
      ...(status ? { status: status as 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          eventId: true,
          participantId: true,
          recipient: true,
          template: true,
          status: true,
          providerMsgId: true,
          error: true,
          sentAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      items: logs,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  }),
);
