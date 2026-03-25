import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PrismaAuditLogRepository } from '@/core/infrastructure/repositories/prisma-audit-log.repository';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

/**
 * POST /api/totem/face-match
 *
 * Face matching endpoint for totem credentialing.
 * Receives a 512-dim embedding and returns the matched participant.
 *
 * Request:
 * {
 *   embedding: number[]   // Float32Array serialized (512 values)
 *   eventId: string
 *   totemId: string
 *   livenessScore?: number
 *   qualityScore?: number
 * }
 *
 * Response (match):
 * {
 *   matched: true
 *   participant: { id, name, badge, company }
 *   confidence: number
 *   checkInId: string
 * }
 *
 * Response (no match):
 * {
 *   matched: false
 *   confidence: number
 *   reason: "below_threshold" | "cooldown" | "not_registered"
 * }
 */

const EMBEDDING_DIM = 512;

const faceMatchSchema = z.object({
  embedding: z.array(z.number()).length(EMBEDDING_DIM, `Embedding must have exactly ${EMBEDDING_DIM} dimensions`),
  eventId: z.string().uuid(),
  totemId: z.string().uuid(),
  livenessScore: z.number().min(0).max(1).optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

// In-memory cooldown tracker (per participant)
const cooldownMap = new Map<string, number>();

interface MatchResult {
  eventParticipantId: string;
  personId: string;
  personName: string;
  company: string | null;
  jobTitle: string | null;
  imageUrl: string | null;
  confidence: number;
}

export const POST = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      const startTime = Date.now();

      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        const body = await req.json();
        const data = faceMatchSchema.parse(body);

        // Verify totem context
        const context = await resolveActiveTotemEventContextByTotemId(totemId);
        if (!context) {
          return NextResponse.json(
            {
              matched: false,
              confidence: 0,
              reason: 'no_active_event',
            },
            { status: 403 },
          );
        }

        // Verify event matches
        if (context.event.id !== data.eventId) {
          return NextResponse.json(
            {
              matched: false,
              confidence: 0,
              reason: 'event_mismatch',
            },
            { status: 400 },
          );
        }

        // Get AI config
        const aiConfig = context.aiConfig;
        const confidenceThreshold = aiConfig.confidenceThreshold;
        const livenessEnabled = aiConfig.livenessDetection;
        const livenessThreshold = aiConfig.livenessThreshold ?? 0.7;
        const cooldownSeconds = aiConfig.cooldownSeconds ?? 8;
        const topK = aiConfig.topKCandidates ?? 5;
        // Note: efSearch is configured at index level, not per-query
        // const efSearch = aiConfig.efSearch ?? 64;

        // Check liveness if enabled
        if (livenessEnabled && data.livenessScore !== undefined) {
          if (data.livenessScore < livenessThreshold) {
            await logAttempt(context, totemId, 'liveness_failed', 0);
            return NextResponse.json(
              {
                matched: false,
                confidence: 0,
                reason: 'liveness_failed',
              },
              { status: 200 },
            );
          }
        }

        // Convert embedding to pgvector format
        const embeddingStr = `[${data.embedding.join(',')}]`;

        // Search for matches using pgvector HNSW
        const matches = await prisma.$queryRaw<MatchResult[]>`
          SELECT 
            ep.id as "eventParticipantId",
            p.id as "personId",
            p.name as "personName",
            ep.company,
            ep.job_title as "jobTitle",
            pf.image_url as "imageUrl",
            1 - (pf.embedding_vector <=> ${embeddingStr}::vector) as confidence
          FROM person_faces pf
          JOIN people p ON p.id = pf.person_id
          JOIN event_participants ep ON ep.person_id = p.id
          WHERE ep.event_id = ${context.event.id}::uuid
            AND pf.is_active = true
            AND pf.embedding_vector IS NOT NULL
            AND p.deleted_at IS NULL
            AND ep.deleted_at IS NULL
          ORDER BY pf.embedding_vector <=> ${embeddingStr}::vector
          LIMIT ${topK}
        `;

        // No matches found
        if (matches.length === 0) {
          await logAttempt(context, totemId, 'not_registered', 0);
          return NextResponse.json(
            {
              matched: false,
              confidence: 0,
              reason: 'not_registered',
            },
            { status: 200 },
          );
        }

        const bestMatch = matches[0];
        const confidence = bestMatch.confidence;

        // Check threshold
        if (confidence < confidenceThreshold) {
          await logAttempt(context, totemId, 'below_threshold', confidence);
          return NextResponse.json(
            {
              matched: false,
              confidence,
              reason: 'below_threshold',
            },
            { status: 200 },
          );
        }

        // Check cooldown
        const cooldownKey = `${context.event.id}:${bestMatch.eventParticipantId}`;
        const lastCheckIn = cooldownMap.get(cooldownKey);
        const now = Date.now();

        if (lastCheckIn && now - lastCheckIn < cooldownSeconds * 1000) {
          const remainingMs = cooldownSeconds * 1000 - (now - lastCheckIn);
          return NextResponse.json(
            {
              matched: false,
              confidence,
              reason: 'cooldown',
              cooldownRemainingMs: remainingMs,
            },
            { status: 200 },
          );
        }

        // Create check-in record
        const checkIn = await prisma.checkIn.create({
          data: {
            method: 'FACE_RECOGNITION',
            confidence,
            checkedInAt: new Date(),
            eventParticipantId: bestMatch.eventParticipantId,
            totemEventSubscriptionId: context.totemEventSubscriptionId,
          },
        });

        // Update cooldown
        cooldownMap.set(cooldownKey, now);

        // Log audit
        const auditRepo = new PrismaAuditLogRepository(prisma);
        await auditRepo.create({
          action: 'CHECK_IN_APPROVED',
          organizationId: context.organizationId,
          eventId: context.event.id,
          metadata: {
            confidence,
            latencyMs: Date.now() - startTime,
            totemId,
            participantId: bestMatch.eventParticipantId,
            checkInId: checkIn.id,
          },
        });

        return NextResponse.json(
          {
            matched: true,
            participant: {
              id: bestMatch.eventParticipantId,
              name: bestMatch.personName,
              company: bestMatch.company,
              jobTitle: bestMatch.jobTitle,
              imageUrl: bestMatch.imageUrl,
            },
            confidence,
            checkInId: checkIn.id,
          },
          { status: 200 },
        );
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              matched: false,
              confidence: 0,
              reason: 'invalid_request',
              error: error.issues[0]?.message,
            },
            { status: 400 },
          );
        }

        console.error('[face-match] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
          {
            matched: false,
            confidence: 0,
            reason: 'internal_error',
            error: message,
          },
          { status: 500 },
        );
      }
    }),
  ),
);

async function logAttempt(
  context: NonNullable<Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>>,
  totemId: string,
  reason: string,
  confidence: number,
): Promise<void> {
  try {
    const auditRepo = new PrismaAuditLogRepository(prisma);
    await auditRepo.create({
      action: 'CHECK_IN_DENIED',
      organizationId: context.organizationId,
      eventId: context.event.id,
      metadata: {
        reason,
        confidence,
        totemId,
      },
    });
  } catch {
    // Don't fail the request if audit logging fails
  }
}
