import { NextRequest, NextResponse } from 'next/server';

import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

interface PersonScope {
  id: string;
  organizationId: string;
  deletedAt: Date | null;
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

export async function getAuthorizedPerson(
  req: NextRequest,
  personId: string,
  includeDeleted = false,
): Promise<PersonScope | NextResponse> {
  const person = await prisma.person.findUnique({
    where: includeDeleted ? { id: personId } : { id: personId, deletedAt: null },
    select: { id: true, organizationId: true, deletedAt: true },
  });

  if (!person) {
    return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
  }

  const accessError = await assertOrganizationAccess(req, person.organizationId);
  if (accessError) {
    return accessError;
  }

  return person;
}
