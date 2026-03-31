import { randomBytes } from 'crypto';

import type { PrismaClient } from '@/generated/prisma/client';

const DEFAULT_CREDENTIAL_LENGTH = 8;
const CREDENTIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomFromAlphabet(length: number): string {
  const bytes = randomBytes(length);
  let output = '';

  for (let index = 0; index < length; index += 1) {
    output += CREDENTIAL_ALPHABET[bytes[index] % CREDENTIAL_ALPHABET.length];
  }

  return output;
}

export function generateCheckInCredential(length: number): string {
  const safeLength = Number.isFinite(length)
    ? Math.max(4, Math.min(64, Math.floor(length)))
    : DEFAULT_CREDENTIAL_LENGTH;
  return randomFromAlphabet(safeLength);
}

export async function resolveTotemAccessCodeLength(db: PrismaClient, organizationId?: string): Promise<number> {
  const totem = await db.totem.findFirst({
    where: {
      deletedAt: null,
      accessCode: { not: null },
      ...(organizationId
        ? {
            organizationSubscriptions: {
              some: {
                organizationId,
                revokedAt: null,
              },
            },
          }
        : {}),
    },
    select: { accessCode: true },
    orderBy: { updatedAt: 'desc' },
  });

  const length = totem?.accessCode?.length ?? DEFAULT_CREDENTIAL_LENGTH;
  return Math.max(4, Math.min(64, length));
}
