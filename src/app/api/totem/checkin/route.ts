import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { containerService } from '@/core/application/services/container.service';
import { enqueueMirrorCheckIn } from '@/core/application/services/sympla/enqueue-mirror-checkin';
import { TotemCheckInService } from '@/core/application/services/totem-checkin.service';
import { faceEmbeddingSchema } from '@/core/communication/requests/person-face';
import { evaluateGatePolicy } from '@/core/domain/value-objects/gate-policy';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PostgresVectorDbRepository } from '@/core/infrastructure/repositories/postgres-vector-db.repository';
import { PrismaAuditLogRepository } from '@/core/infrastructure/repositories/prisma-audit-log.repository';
import { resolveParticipantName } from '@/core/utils/participant-identity';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

// The queue may be drained after the response (see kickJobDrain); give it room to finish.
export const maxDuration = 60;

const faceCheckInSchema = z.object({
  method: z.literal('FACE'),
  embedding: faceEmbeddingSchema,
  faceCount: z.number().int().min(1).max(10).default(1),
  livenessScore: z.number().min(0).max(1).optional(),
  blinkDetected: z.boolean().optional(),
  trackId: z.string().min(1).optional(),
  trackStability: z.number().min(0).max(1).optional(),
  historicalLivenessAvg: z.number().min(0).max(1).optional(),
});

const legacyFaceCheckInSchema = z
  .object({
    embedding: faceEmbeddingSchema,
    faceCount: z.number().int().min(1).max(10).default(1),
    livenessScore: z.number().min(0).max(1).optional(),
    blinkDetected: z.boolean().optional(),
    trackId: z.string().min(1).optional(),
    trackStability: z.number().min(0).max(1).optional(),
    historicalLivenessAvg: z.number().min(0).max(1).optional(),
  })
  .transform((payload) => ({
    ...payload,
    method: 'FACE' as const,
  }));

const qrCheckInSchema = z.object({
  method: z.literal('QR'),
  qrCodeValue: z.string().trim().min(1, 'QR value is required.'),
});

const codeCheckInSchema = z.object({
  method: z.literal('CODE'),
  accessCode: z.string().trim().min(1, 'Access code is required.'),
});

/** Sympla ticket_status values that mean the ticket is no longer valid. */
const CANCELLED_TICKET_STATUSES = ['C', 'R', 'CANCELED', 'CANCELLED', 'REFUNDED'];

const checkInSchema = z.union([faceCheckInSchema, qrCheckInSchema, codeCheckInSchema, legacyFaceCheckInSchema]);

type TotemCheckInRequest = z.infer<typeof checkInSchema>;

type CredentialCheckInMethod = Extract<TotemCheckInRequest, { method: 'QR' | 'CODE' }>['method'];

type CredentialParticipantMatch = {
  id: string;
  company: string | null;
  jobTitle: string | null;
  accessCode: string | null;
  qrCodeValue: string | null;
  attendeeFullName: string | null;
  attendeeEmail: string | null;
  attendeeDocument: string | null;
  ticketNumber: string | null;
  ticketName: string | null;
  ticketStatus: string | null;
  sectorName: string | null;
  seatLabel: string | null;
  person: {
    name: string;
    faces: Array<{ imageUrl: string | null }>;
  } | null;
};

function makeCheckInService(): TotemCheckInService {
  const vectorDb = new PostgresVectorDbRepository(prisma);
  const auditLog = new PrismaAuditLogRepository(prisma);
  // FASE 3: Inject performance optimization services
  const cooldownService = containerService.getCooldownService();
  const metricsService = containerService.getCheckInMetricsService();
  const confidenceThresholdService = containerService.getConfidenceThresholdService();

  return new TotemCheckInService(
    prisma,
    auditLog,
    vectorDb,
    cooldownService,
    metricsService,
    confidenceThresholdService,
  );
}

function isMethodEnabled(
  method: TotemCheckInRequest['method'],
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
): boolean {
  if (method === 'FACE') {
    return context.event.faceEnabled;
  }

  if (method === 'QR') {
    return context.event.qrEnabled;
  }

  return context.event.codeEnabled;
}

function getDisabledMethodMessage(method: TotemCheckInRequest['method']): string {
  if (method === 'FACE') {
    return 'Face recognition check-in is disabled for this event.';
  }

  if (method === 'QR') {
    return 'QR check-in is disabled for this event.';
  }

  return 'Code check-in is disabled for this event.';
}

async function logDeniedAttempt(
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  totemId: string,
  code: string,
  reason: string,
  metadata?: Record<string, unknown>,
) {
  const auditRepo = new PrismaAuditLogRepository(prisma);

  await auditRepo.create({
    action: 'CHECK_IN_DENIED',
    organizationId: context.organizationId,
    eventId: context.event.id,
    metadata: {
      code,
      reason,
      totemId,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
      ...metadata,
    },
  });
}

async function logApprovedAttempt(
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  totemId: string,
  checkInId: string,
  eventParticipantId: string,
  method: 'QR_CODE' | 'ACCESS_CODE',
) {
  const auditRepo = new PrismaAuditLogRepository(prisma);

  await auditRepo.create({
    action: 'CHECK_IN_APPROVED',
    organizationId: context.organizationId,
    eventId: context.event.id,
    metadata: {
      totemId,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
      checkInId,
      eventParticipantId,
      method,
    },
  });
}

const CREDENTIAL_PARTICIPANT_SELECT = {
  id: true,
  company: true,
  jobTitle: true,
  accessCode: true,
  qrCodeValue: true,
  attendeeFullName: true,
  attendeeEmail: true,
  attendeeDocument: true,
  ticketNumber: true,
  ticketName: true,
  ticketStatus: true,
  sectorName: true,
  seatLabel: true,
  person: {
    select: {
      name: true,
      faces: {
        where: { deletedAt: null, isActive: true },
        select: { imageUrl: true },
        take: 1,
      },
    },
  },
} as const;

async function findParticipantById(id: string): Promise<CredentialParticipantMatch | null> {
  return prisma.eventParticipant.findUnique({ where: { id }, select: CREDENTIAL_PARTICIPANT_SELECT });
}

async function findParticipantByCredential(
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  method: CredentialCheckInMethod,
  value: string,
): Promise<CredentialParticipantMatch | null> {
  const whereCredential =
    method === 'QR'
      ? {
          OR: [{ qrCodeValue: value }, { person: { qrCodeValue: value } }],
        }
      : {
          OR: [{ accessCode: value }, { person: { accessCode: value } }],
        };

  return prisma.eventParticipant.findFirst({
    where: {
      eventId: context.event.id,
      deletedAt: null,
      // Both clauses are ORs, so they have to be ANDed explicitly — spreading one over the
      // other would silently drop it. The first says the identity, if any, is not soft-deleted:
      // a to-one relation filter excludes rows where the relation is null, so a bare
      // `person: { deletedAt: null }` would make every identity-less ticket impossible to
      // check in. The second is the credential match itself.
      AND: [{ OR: [{ personId: null }, { person: { deletedAt: null } }] }, whereCredential],
    },
    select: CREDENTIAL_PARTICIPANT_SELECT,
  });
}

/**
 * Resolves a scanned QR against the hyphen-stripped ticket number.
 *
 * Expressed as raw SQL because Prisma's filters cannot call replace(). It runs only after the
 * indexed lookup has already missed, so the sequential scan it implies is on the failure path
 * rather than the hot one.
 */
async function findParticipantByStrippedTicketNumber(
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  value: string,
): Promise<CredentialParticipantMatch | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM event_participants
    WHERE event_id = ${context.event.id}
      AND deleted_at IS NULL
      AND ticket_number IS NOT NULL
      AND replace(ticket_number, '-', '') = ${value}
    LIMIT 1
  `;

  const id = rows[0]?.id;
  if (!id) return null;

  return findParticipantById(id);
}

async function executeCredentialCheckIn(
  input: Extract<TotemCheckInRequest, { method: 'QR' | 'CODE' }>,
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  totemId: string,
) {
  const normalizedValue = input.method === 'CODE' ? input.accessCode.trim().toUpperCase() : input.qrCodeValue.trim();

  let participant = await findParticipantByCredential(context, input.method, normalizedValue);

  // A Sympla QR carries the ticket number with its hyphens stripped: ticket "UVKL-LL-QDAT" is
  // encoded as "UVKLLLQDAT" (verified against the live API). Normally the scan matches
  // qrCodeValue directly, but when ticket_num_qr_code did not come down we generated a random QR
  // instead — and then the attendee's real QR matches nothing. Comparing against the stripped
  // ticket number closes that gap locally, with no extra API call.
  if (!participant && input.method === 'QR') {
    participant = await findParticipantByStrippedTicketNumber(context, normalizedValue);
  }

  // Still nothing: usually a ticket bought after the last sync. Ask Sympla once, persist what
  // comes back, and retry the local lookup — the attendee gets in instead of being told their
  // valid ticket does not exist. See SymplaGateFallbackService for what this can resolve.
  if (!participant) {
    const resolvedId = await containerService
      .getSymplaGateFallbackService()
      .resolveByTicketNumber(context.event.id, normalizedValue);

    if (resolvedId) {
      participant = await findParticipantByCredential(context, input.method, normalizedValue);
    }
  }

  if (!participant) {
    await logDeniedAttempt(context, totemId, 'CHECKIN_PARTICIPANT_NOT_FOUND', 'PARTICIPANT_NOT_FOUND', {
      method: input.method,
    });

    return NextResponse.json(
      {
        error: 'Participant not found.',
        code: 'CHECKIN_PARTICIPANT_NOT_FOUND',
      },
      { status: 404 },
    );
  }

  // ── Gate policy ──────────────────────────────────────────────────
  // Same evaluation the face path uses, so a rule cannot hold at one door and not another.
  const gateDecision = evaluateGatePolicy(context.gatePolicy, {
    sectorName: participant.sectorName,
    ticketName: participant.ticketName,
  });

  if (!gateDecision.allowed) {
    await logDeniedAttempt(context, totemId, 'CHECKIN_WRONG_GATE', gateDecision.reason, {
      method: input.method,
      eventParticipantId: participant.id,
      sectorName: participant.sectorName,
      ticketName: participant.ticketName,
    });

    return NextResponse.json(
      {
        error:
          gateDecision.reason === 'SECTOR_NOT_ALLOWED'
            ? 'Este ingresso não é válido nesta portaria.'
            : 'Este tipo de ingresso não é aceito nesta portaria.',
        code: 'CHECKIN_WRONG_GATE',
      },
      { status: 403 },
    );
  }

  // A cancelled or refunded ticket must not open the gate. Sympla keeps the row on the list
  // precisely so the gate can tell the difference between "not found" and "no longer valid",
  // and the attendee deserves to hear which one it is.
  if (participant.ticketStatus && CANCELLED_TICKET_STATUSES.includes(participant.ticketStatus.toUpperCase())) {
    await logDeniedAttempt(context, totemId, 'CHECKIN_TICKET_CANCELLED', 'TICKET_CANCELLED', {
      method: input.method,
      eventParticipantId: participant.id,
      ticketStatus: participant.ticketStatus,
    });

    return NextResponse.json(
      {
        error: 'Este ingresso foi cancelado ou reembolsado.',
        code: 'CHECKIN_TICKET_CANCELLED',
      },
      { status: 409 },
    );
  }

  const duplicate = await prisma.checkIn.findFirst({
    where: { eventParticipantId: participant.id },
    select: { id: true },
  });

  if (duplicate) {
    await logDeniedAttempt(context, totemId, 'CHECKIN_DUPLICATE', 'DUPLICATE', {
      method: input.method,
      eventParticipantId: participant.id,
    });

    return NextResponse.json(
      {
        error: 'Participant already checked in.',
        code: 'CHECKIN_DUPLICATE',
      },
      { status: 409 },
    );
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      method: input.method === 'QR' ? 'QR_CODE' : 'ACCESS_CODE',
      confidence: null,
      checkedInAt: new Date(),
      eventParticipantId: participant.id,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
    },
  });

  await logApprovedAttempt(
    context,
    totemId,
    checkIn.id,
    participant.id,
    input.method === 'QR' ? 'QR_CODE' : 'ACCESS_CODE',
  );

  await enqueueMirrorCheckIn(checkIn.id, context.organizationId);

  return NextResponse.json(
    {
      id: checkIn.id,
      confidence: checkIn.confidence,
      checkedInAt: checkIn.checkedInAt,
      eventParticipantId: participant.id,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
      participant: {
        name: resolveParticipantName(participant),
        company: participant.company,
        jobTitle: participant.jobTitle,
        imageUrl: participant.person?.faces[0]?.imageUrl ?? null,
        accessCode: participant.accessCode,
        qrCodeValue: participant.qrCodeValue,
        ticketNumber: participant.ticketNumber,
        ticketName: participant.ticketName,
        sectorName: participant.sectorName,
        seatLabel: participant.seatLabel,
      },
    },
    { status: 201 },
  );
}

export const POST = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        const body = await req.json();
        const data = checkInSchema.parse(body);

        const activeContext = await resolveActiveTotemEventContextByTotemId(totemId);
        if (!activeContext) {
          return NextResponse.json(
            {
              error: 'No active event assigned to this totem.',
              code: 'TOTEM_NO_ACTIVE_EVENT',
            },
            { status: 403 },
          );
        }

        if (!isMethodEnabled(data.method, activeContext)) {
          const code = 'CHECKIN_METHOD_DISABLED';
          await logDeniedAttempt(activeContext, totemId, code, 'METHOD_DISABLED', {
            method: data.method,
          });

          return NextResponse.json(
            {
              error: getDisabledMethodMessage(data.method),
              code,
            },
            { status: 403 },
          );
        }

        if (data.method === 'QR' || data.method === 'CODE') {
          return executeCredentialCheckIn(data, activeContext, totemId);
        }

        const service = makeCheckInService();
        const result = await service.execute(
          {
            embedding: data.embedding,
            faceCount: data.faceCount,
            livenessScore: data.livenessScore,
            blinkDetected: data.blinkDetected,
            trackId: data.trackId,
            trackStability: data.trackStability,
            historicalLivenessAvg: data.historicalLivenessAvg,
          },
          activeContext,
          totemId,
        );

        if (!result.success) {
          const { error } = result;
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              ...(error.confidence !== undefined ? { confidence: error.confidence } : {}),
              ...(error.threshold !== undefined ? { threshold: error.threshold } : {}),
            },
            { status: error.status },
          );
        }

        return NextResponse.json(result.data, { status: 201 });
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'Internal server error.';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }),
  ),
);
