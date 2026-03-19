import { NextRequest, NextResponse } from 'next/server';

import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

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
