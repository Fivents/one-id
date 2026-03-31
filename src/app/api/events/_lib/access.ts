import { NextRequest, NextResponse } from 'next/server';

import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

interface EventScope {
  id: string;
  organizationId: string;
  faceEnabled: boolean;
  qrEnabled: boolean;
  codeEnabled: boolean;
}

export async function assertOrganizationAccess(req: NextRequest, organizationId: string): Promise<NextResponse | null> {
  const auth = getUserAuth(req);

  if (auth.role === 'SUPER_ADMIN') {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: auth.userId,
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden. Organization access denied.' }, { status: 403 });
  }

  return null;
}

export async function getAuthorizedEvent(req: NextRequest, eventId: string): Promise<EventScope | NextResponse> {
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: {
      id: true,
      organizationId: true,
      faceEnabled: true,
      qrEnabled: true,
      codeEnabled: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  const accessError = await assertOrganizationAccess(req, event.organizationId);
  if (accessError) {
    return accessError;
  }

  return event;
}
