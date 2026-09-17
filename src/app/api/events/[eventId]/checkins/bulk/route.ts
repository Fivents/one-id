import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';

const MAX_ENTRIES = 1000;

const identifierSchema = z.object({
  row: z.number().int().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  document: z.string().optional(),
  accessCode: z.string().optional(),
});

const bulkCheckInSchema = z
  .object({
    method: z.enum(['MANUAL', 'QR_CODE', 'FACE_RECOGNITION', 'ACCESS_CODE']).default('MANUAL'),
    participantIds: z.array(z.string().min(1)).max(MAX_ENTRIES).optional(),
    identifiers: z.array(identifierSchema).max(MAX_ENTRIES).optional(),
  })
  .refine(
    (value) => (value.participantIds?.length ?? 0) > 0 || (value.identifiers?.length ?? 0) > 0,
    'Provide at least one participant id or identifier.',
  );

type BulkCheckInError = { row?: number; identifier?: string; message: string };

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Index participants by a key, marking keys shared by more than one participant as ambiguous
 * (stored as `null`) so a spreadsheet row can never silently check in the wrong person.
 */
function indexBy<T>(rows: T[], keyOf: (row: T) => string | null): Map<string, T | null> {
  const map = new Map<string, T | null>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    map.set(key, map.has(key) ? null : row);
  }
  return map;
}

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
      const data = bulkCheckInSchema.parse(body);

      const participants = await prisma.eventParticipant.findMany({
        where: { eventId, deletedAt: null },
        select: {
          id: true,
          accessCode: true,
          person: { select: { name: true, email: true, document: true } },
          checkIns: { select: { id: true }, take: 1 },
        },
      });

      type ParticipantRow = (typeof participants)[number];

      const errors: BulkCheckInError[] = [];
      const resolved = new Map<string, ParticipantRow>();

      if (data.participantIds?.length) {
        const byId = new Map(participants.map((participant) => [participant.id, participant]));
        for (const participantId of data.participantIds) {
          const participant = byId.get(participantId);
          if (!participant) {
            errors.push({ identifier: participantId, message: 'Participant not found for this event.' });
            continue;
          }
          resolved.set(participant.id, participant);
        }
      }

      if (data.identifiers?.length) {
        const byEmail = indexBy(participants, (p) => p.person.email?.trim().toLowerCase() || null);
        const byDocument = indexBy(participants, (p) => onlyDigits(p.person.document ?? '') || null);
        const byAccessCode = indexBy(participants, (p) => p.accessCode?.trim().toUpperCase() || null);

        for (const identifier of data.identifiers) {
          const email = identifier.email?.trim().toLowerCase() || '';
          const document = onlyDigits(identifier.document ?? '');
          const accessCode = identifier.accessCode?.trim().toUpperCase() || '';
          const label = email || identifier.document?.trim() || accessCode || identifier.name?.trim() || '';

          if (!email && !document && !accessCode) {
            errors.push({
              row: identifier.row,
              identifier: label,
              message: 'Row has no email, document or access code.',
            });
            continue;
          }

          // Precedence: email -> document -> access code.
          const candidates = [
            email ? byEmail.get(email) : undefined,
            document ? byDocument.get(document) : undefined,
            accessCode ? byAccessCode.get(accessCode) : undefined,
          ];

          const firstDefined = candidates.find((candidate) => candidate !== undefined);

          if (firstDefined === null) {
            errors.push({
              row: identifier.row,
              identifier: label,
              message: 'More than one participant matches this identifier.',
            });
            continue;
          }

          if (!firstDefined) {
            errors.push({
              row: identifier.row,
              identifier: label,
              message: 'No participant of this event matches this identifier.',
            });
            continue;
          }

          resolved.set(firstDefined.id, firstDefined);
        }
      }

      const targets = [...resolved.values()];
      const toCreate = targets.filter((participant) => participant.checkIns.length === 0);
      const skipped = targets
        .filter((participant) => participant.checkIns.length > 0)
        .map((participant) => ({ participantId: participant.id, name: participant.person.name }));

      let createdCount = 0;

      if (toCreate.length > 0) {
        const latestSession = await prisma.session.findFirst({
          where: { userId: auth.userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        const checkedInAt = new Date();
        const participantIds = toCreate.map((participant) => participant.id);

        createdCount = await prisma.$transaction(async (tx) => {
          await tx.checkIn.createMany({
            data: toCreate.map((participant) => ({
              method: data.method,
              confidence: null,
              checkedInAt,
              eventParticipantId: participant.id,
              totemEventSubscriptionId: null,
            })),
          });

          const created = await tx.checkIn.findMany({
            where: { eventParticipantId: { in: participantIds } },
            select: { id: true, eventParticipantId: true, method: true },
          });

          // One audit row per check-in: the check-ins listing resolves `handledBy` by matching
          // `metadata.checkInId` / `metadata.eventParticipantId`.
          await tx.auditLog.createMany({
            data: created.map((checkIn) => ({
              action: 'CHECK_IN' as const,
              description: 'Bulk app check-in registered.',
              metadata: {
                source: 'APP',
                bulk: true,
                checkInId: checkIn.id,
                eventParticipantId: checkIn.eventParticipantId,
                method: checkIn.method,
              },
              eventId,
              organizationId: eventOrResponse.organizationId,
              userId: auth.userId,
              sessionId: latestSession?.id,
            })),
          });

          return created.length;
        });
      }

      return NextResponse.json({ created: createdCount, skipped, errors }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register bulk check-ins.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);
