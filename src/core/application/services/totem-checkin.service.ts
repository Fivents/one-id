import type { ActiveTotemContext } from '@/app/api/totem/_lib/active-totem-context';
import type { CreateAuditLogData, IAuditLogRepository } from '@/core/domain/contracts';
import type { PrismaClient } from '@/generated/prisma/client';

// ── Types ────────────────────────────────────────────────────────────

const FACE_EMBEDDING_DIMENSION = 512;
const PERSON_COOLDOWN_MS = 5_000;

export interface CheckInInput {
  embedding: number[];
  faceCount: number;
  livenessScore?: number;
  blinkDetected?: boolean;
}

export interface CheckInParticipant {
  name: string;
  company: string | null;
  jobTitle: string | null;
  imageUrl: string | null;
}

export interface CheckInResult {
  id: string;
  confidence: number;
  checkedInAt: Date;
  eventParticipantId: string;
  totemEventSubscriptionId: string;
  participant: CheckInParticipant;
}

export type CheckInError = {
  code: string;
  message: string;
  status: number;
  confidence?: number;
  threshold?: number;
};

// ── Cosine Similarity ────────────────────────────────────────────────

function cosineSimilarity(a: Buffer, b: Buffer): number {
  const vecA = new Float32Array(a.buffer, a.byteOffset, Math.floor(a.byteLength / 4));
  const vecB = new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));

  const length = Math.min(vecA.length, vecB.length);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i += 1) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / Math.sqrt(normA * normB);
}

// ── Service ──────────────────────────────────────────────────────────

export class TotemCheckInService {
  constructor(
    private readonly db: PrismaClient,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(
    input: CheckInInput,
    context: ActiveTotemContext,
    totemId: string,
  ): Promise<{ success: true; data: CheckInResult } | { success: false; error: CheckInError }> {
    // ── Validate embedding dimension ──────────────────────────────
    if (!Array.isArray(input.embedding) || input.embedding.length !== FACE_EMBEDDING_DIMENSION) {
      return this.deny(
        'CHECKIN_INVALID_EMBEDDING',
        `Embedding must contain ${FACE_EMBEDDING_DIMENSION} dimensions.`,
        400,
        context,
        totemId,
      );
    }

    // ── Validate face count ───────────────────────────────────────
    if (input.faceCount > context.aiConfig.maxFaces) {
      return this.deny(
        'CHECKIN_MULTIPLE_FACES',
        'Multiple faces detected. Please keep only one person in front of the camera.',
        409,
        context,
        totemId,
        {
          faceCount: input.faceCount,
          maxFacesAllowed: context.aiConfig.maxFaces,
        },
      );
    }

    // ── Liveness check ────────────────────────────────────────────
    if (context.aiConfig.livenessDetection && (input.livenessScore ?? 0) < 0.5) {
      return this.deny(
        'CHECKIN_LOW_LIVENESS',
        'Liveness check failed. Please present a live face.',
        400,
        context,
        totemId,
        {
          livenessScore: input.livenessScore ?? 0,
          livenessThreshold: 0.5,
          faceCount: input.faceCount,
          ...(input.blinkDetected !== undefined && { blinkDetected: input.blinkDetected }),
        },
      );
    }

    // ── Blink detection ───────────────────────────────────────────
    if (context.aiConfig.livenessDetection && !input.blinkDetected) {
      return this.deny('CHECKIN_NO_BLINK', 'Blink not detected. Please present a live face.', 400, context, totemId, {
        blinkDetected: false,
        faceCount: input.faceCount,
      });
    }

    // ── Find best match ───────────────────────────────────────────
    const probeEmbedding = Buffer.from(new Float32Array(input.embedding).buffer);

    const participants = await this.db.eventParticipant.findMany({
      where: {
        eventId: context.event.id,
        deletedAt: null,
        person: {
          deletedAt: null,
        },
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
                id: true,
                embedding: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    let bestMatch:
      | {
          eventParticipantId: string;
          participantName: string;
          company: string | null;
          jobTitle: string | null;
          faceImageUrl: string | null;
          confidence: number;
        }
      | undefined;

    for (const participant of participants) {
      for (const face of participant.person.faces) {
        const confidence = cosineSimilarity(Buffer.from(face.embedding), probeEmbedding);

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            eventParticipantId: participant.id,
            participantName: participant.person.name,
            company: participant.company,
            jobTitle: participant.jobTitle,
            faceImageUrl: face.imageUrl,
            confidence,
          };
        }
      }
    }

    if (!bestMatch) {
      return this.deny('CHECKIN_PARTICIPANT_NOT_FOUND', 'Participant not found.', 404, context, totemId);
    }

    // ── Confidence threshold ──────────────────────────────────────
    if (bestMatch.confidence < context.aiConfig.confidenceThreshold) {
      return this.deny('CHECKIN_LOW_CONFIDENCE', 'Confidence below threshold.', 400, context, totemId, {
        confidence: bestMatch.confidence,
        threshold: context.aiConfig.confidenceThreshold,
        faceCount: input.faceCount,
        participantName: bestMatch.participantName,
        eventParticipantId: bestMatch.eventParticipantId,
      });
    }

    // ── Duplicate check ───────────────────────────────────────────
    const duplicate = await this.db.checkIn.findFirst({
      where: {
        eventParticipantId: bestMatch.eventParticipantId,
      },
      select: { id: true },
    });

    if (duplicate) {
      return this.deny('CHECKIN_DUPLICATE', 'Participant already checked in.', 409, context, totemId, {
        participantName: bestMatch.participantName,
      });
    }

    // ── Person cooldown ───────────────────────────────────────────
    const cooldownCheck = await this.db.checkIn.findFirst({
      where: {
        eventParticipantId: bestMatch.eventParticipantId,
        checkedInAt: {
          gte: new Date(Date.now() - PERSON_COOLDOWN_MS),
        },
      },
      select: { id: true },
    });

    if (cooldownCheck) {
      return this.deny('CHECKIN_PERSON_COOLDOWN', 'Check-in blocked by anti-fraud cooldown.', 429, context, totemId);
    }

    // ── Create check-in ───────────────────────────────────────────
    const checkIn = await this.db.checkIn.create({
      data: {
        method: 'FACE_RECOGNITION',
        confidence: bestMatch.confidence,
        checkedInAt: new Date(),
        eventParticipantId: bestMatch.eventParticipantId,
        totemEventSubscriptionId: context.totemEventSubscriptionId,
      },
    });

    // ── Audit log: approved ───────────────────────────────────────
    await this.logAudit({
      action: 'CHECK_IN_APPROVED',
      description: `Check-in approved for ${bestMatch.participantName} with confidence ${bestMatch.confidence.toFixed(4)}`,
      metadata: {
        checkInId: checkIn.id,
        confidence: bestMatch.confidence,
        confidenceThreshold: context.aiConfig.confidenceThreshold,
        totemId,
        eventId: context.event.id,
        totemEventSubscriptionId: context.totemEventSubscriptionId,
        participantName: bestMatch.participantName,
        eventParticipantId: bestMatch.eventParticipantId,
        faceCount: input.faceCount,
        ...(input.livenessScore !== undefined && { livenessScore: input.livenessScore }),
        ...(input.blinkDetected !== undefined && { blinkDetected: input.blinkDetected }),
      },
      organizationId: context.organizationId,
      eventId: context.event.id,
    });

    return {
      success: true,
      data: {
        id: checkIn.id,
        confidence: checkIn.confidence!,
        checkedInAt: checkIn.checkedInAt,
        eventParticipantId: bestMatch.eventParticipantId,
        totemEventSubscriptionId: context.totemEventSubscriptionId,
        participant: {
          name: bestMatch.participantName,
          company: bestMatch.company,
          jobTitle: bestMatch.jobTitle,
          imageUrl: bestMatch.faceImageUrl,
        },
      },
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async deny(
    code: string,
    message: string,
    status: number,
    context: ActiveTotemContext,
    totemId: string,
    extra?: Record<string, unknown>,
  ): Promise<{ success: false; error: CheckInError }> {
    await this.logAudit({
      action: 'CHECK_IN_DENIED',
      description: `Check-in denied: ${code}`,
      metadata: {
        code,
        totemId,
        eventId: context.event.id,
        totemEventSubscriptionId: context.totemEventSubscriptionId,
        ...extra,
      },
      organizationId: context.organizationId,
      eventId: context.event.id,
    });

    return {
      success: false,
      error: {
        code,
        message,
        status,
        ...(extra?.confidence !== undefined ? { confidence: extra.confidence as number } : {}),
        ...(extra?.threshold !== undefined ? { threshold: extra.threshold as number } : {}),
      },
    };
  }

  private async logAudit(data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditLogRepository.create(data);
    } catch {
      // Audit logging should never block the check-in flow
      console.error('[TotemCheckInService] Failed to create audit log:', data.action);
    }
  }
}
