import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { containerService } from '@/core/application/services/container.service';
import { TotemCheckInService } from '@/core/application/services/totem-checkin.service';
import { faceEmbeddingSchema } from '@/core/communication/requests/person-face';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PostgresVectorDbRepository } from '@/core/infrastructure/repositories/postgres-vector-db.repository';
import { PrismaAuditLogRepository } from '@/core/infrastructure/repositories/prisma-audit-log.repository';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

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

const checkInSchema = z.union([faceCheckInSchema, qrCheckInSchema, codeCheckInSchema, legacyFaceCheckInSchema]);

type TotemCheckInRequest = z.infer<typeof checkInSchema>;

type CredentialCheckInMethod = Extract<TotemCheckInRequest, { method: 'QR' | 'CODE' }>['method'];

type CredentialParticipantMatch = {
  id: string;
  company: string | null;
  jobTitle: string | null;
  person: {
    name: string;
    faces: Array<{ imageUrl: string | null }>;
  };
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
  method: 'QR_CODE' | 'MANUAL',
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
      person: { deletedAt: null },
      ...whereCredential,
    },
    select: {
      id: true,
      company: true,
      jobTitle: true,
      person: {
        select: {
          name: true,
          faces: {
            where: {
              deletedAt: null,
              isActive: true,
            },
            select: {
              imageUrl: true,
            },
            take: 1,
          },
        },
      },
    },
  });
}

async function executeCredentialCheckIn(
  input: Extract<TotemCheckInRequest, { method: 'QR' | 'CODE' }>,
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  totemId: string,
) {
  const normalizedValue = input.method === 'CODE' ? input.accessCode.trim().toUpperCase() : input.qrCodeValue.trim();

  const participant = await findParticipantByCredential(context, input.method, normalizedValue);

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
      method: input.method === 'QR' ? 'QR_CODE' : 'MANUAL',
      confidence: null,
      checkedInAt: new Date(),
      eventParticipantId: participant.id,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
    },
  });

  await logApprovedAttempt(context, totemId, checkIn.id, participant.id, input.method === 'QR' ? 'QR_CODE' : 'MANUAL');

  return NextResponse.json(
    {
      id: checkIn.id,
      confidence: checkIn.confidence,
      checkedInAt: checkIn.checkedInAt,
      eventParticipantId: participant.id,
      totemEventSubscriptionId: context.totemEventSubscriptionId,
      participant: {
        name: participant.person.name,
        company: participant.company,
        jobTitle: participant.jobTitle,
        imageUrl: participant.person.faces[0]?.imageUrl ?? null,
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
