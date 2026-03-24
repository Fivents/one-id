import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { faceEmbeddingSchema } from '@/core/communication/requests/person-face';
import { containerService } from '@/core/application/services/container.service';
import { TotemCheckInService } from '@/core/application/services/totem-checkin.service';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PostgresVectorDbRepository } from '@/core/infrastructure/repositories/postgres-vector-db.repository';
import { PrismaAuditLogRepository } from '@/core/infrastructure/repositories/prisma-audit-log.repository';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

const checkInSchema = z.object({
  embedding: faceEmbeddingSchema,
  faceCount: z.number().int().min(0).max(10).default(1),
  livenessScore: z.number().min(0).max(1).optional(),
  blinkDetected: z.boolean().optional().default(false),
  // NEW (Phase 4): Face tracking fields
  trackId: z.string().min(1).optional(),
  trackStability: z.number().min(0).max(1).optional(),
  historicalLivenessAvg: z.number().min(0).max(1).optional(),
});

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

        const service = makeCheckInService();
        const result = await service.execute(data, activeContext, totemId);

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
