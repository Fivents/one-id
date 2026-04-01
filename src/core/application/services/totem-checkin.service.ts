import type { ActiveTotemContext } from '@/app/api/totem/_lib/active-totem-context';
import type {
  CreateAuditLogData,
  IAuditLogRepository,
  ICheckInMetricsService,
  IConfidenceThresholdService,
  ICooldownService,
  IVectorDbRepository,
} from '@/core/domain/contracts';
import type { PrismaClient } from '@/generated/prisma/client';

// ── Types ────────────────────────────────────────────────────────────

const FACE_EMBEDDING_DIMENSION = 512;
const PERSON_COOLDOWN_MS = 5_000;
const MIN_SEARCH_THRESHOLD = 0.5;

export interface CheckInInput {
  embedding: number[];
  faceCount: number;
  livenessScore?: number;
  blinkDetected?: boolean;
  // NEW (Phase 4): Face tracking fields
  trackId?: string;
  trackStability?: number;
  historicalLivenessAvg?: number;
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

type MatchCandidate = {
  eventParticipantId: string;
  participantName: string;
  company: string | null;
  jobTitle: string | null;
  faceImageUrl: string | null;
  confidence: number;
};

export type CheckInError = {
  code: string;
  message: string;
  status: number;
  confidence?: number;
  threshold?: number;
};

// ── Service ──────────────────────────────────────────────────────────

export class TotemCheckInService {
  constructor(
    private readonly db: PrismaClient,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly vectorDbRepository?: IVectorDbRepository,
    private readonly cooldownService?: ICooldownService,
    private readonly metricsService?: ICheckInMetricsService,
    private readonly confidenceThresholdService?: IConfidenceThresholdService,
  ) {}

  async execute(
    input: CheckInInput,
    context: ActiveTotemContext,
    totemId: string,
  ): Promise<{ success: true; data: CheckInResult } | { success: false; error: CheckInError }> {
    const startTime = Date.now();
    let failureReason: string | undefined;

    try {
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
      if (input.faceCount < 1) {
        failureReason = 'NO_FACE_DETECTED';
        return this.deny(
          'CHECKIN_NO_FACE_DETECTED',
          'No face detected. Please position your face in front of the camera.',
          400,
          context,
          totemId,
        );
      }

      if (input.faceCount > context.aiConfig.maxFaces) {
        failureReason = 'MULTIPLE_FACES';
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
      const livenessThreshold = context.aiConfig.livenessThreshold ?? 0.5;
      const hasLivenessSignal =
        input.livenessScore !== undefined ||
        input.blinkDetected !== undefined ||
        input.trackStability !== undefined ||
        input.historicalLivenessAvg !== undefined;

      if (
        context.aiConfig.livenessDetection &&
        hasLivenessSignal &&
        input.livenessScore !== undefined &&
        input.livenessScore < livenessThreshold
      ) {
        failureReason = 'LIVENESS_FAILED';
        return this.deny(
          'CHECKIN_LOW_LIVENESS',
          'Liveness check failed. Please present a live face.',
          400,
          context,
          totemId,
          {
            livenessScore: input.livenessScore,
            livenessThreshold,
            faceCount: input.faceCount,
            ...(input.blinkDetected !== undefined && { blinkDetected: input.blinkDetected }),
          },
        );
      }

      // ── Blink detection ───────────────────────────────────────────
      if (
        context.aiConfig.livenessDetection &&
        hasLivenessSignal &&
        input.blinkDetected !== undefined &&
        !input.blinkDetected
      ) {
        failureReason = 'LIVENESS_FAILED';
        return this.deny('CHECKIN_NO_BLINK', 'Blink not detected. Please present a live face.', 400, context, totemId, {
          blinkDetected: false,
          faceCount: input.faceCount,
        });
      }

      // ── NEW (Phase 4): Temporal Liveness Validation (from tracking) ───
      if (input.trackStability !== undefined && input.historicalLivenessAvg !== undefined) {
        // Require both tracking confidence AND historical liveness evidence
        if (input.trackStability < 0.5) {
          failureReason = 'LOW_TRACKING_CONFIDENCE';
          return this.deny(
            'CHECKIN_UNSTABLE_TRACK',
            'Face not stable. Please keep your face steady in front of the camera.',
            400,
            context,
            totemId,
            {
              trackStability: input.trackStability,
              trackId: input.trackId,
              faceCount: input.faceCount,
            },
          );
        }

        if (input.historicalLivenessAvg < 0.5) {
          failureReason = 'HISTORICAL_LIVENESS_FAILED';
          return this.deny(
            'CHECKIN_LOW_HISTORICAL_LIVENESS',
            'Not enough liveness evidence from tracking. Please try again.',
            400,
            context,
            totemId,
            {
              historicalLivenessAvg: input.historicalLivenessAvg,
              trackStability: input.trackStability,
              trackId: input.trackId,
            },
          );
        }
      }

      // ── Find best match (using Vector Search if available) ────────
      const probeEmbedding = input.embedding;
      const configuredConfidenceThreshold = this.normalizeThreshold(context.aiConfig.confidenceThreshold);

      if (!this.vectorDbRepository) {
        failureReason = 'VECTOR_SEARCH_UNAVAILABLE';
        return this.deny(
          'CHECKIN_VECTOR_SEARCH_UNAVAILABLE',
          'Vector search is not available for face check-in.',
          500,
          context,
          totemId,
        );
      }

      // ── PHASE 1: Use Vector Search (O(log n)) ────────────────────
      const searchResults = await this.vectorDbRepository.searchTopK({
        embedding: probeEmbedding,
        eventId: context.event.id,
        organizationId: context.organizationId,
        k: 5,
        threshold: MIN_SEARCH_THRESHOLD,
      });

      const topMatch = searchResults[0];

      const bestMatch: MatchCandidate | undefined = topMatch
        ? {
            eventParticipantId: topMatch.eventParticipantId,
            participantName: topMatch.personName,
            company: topMatch.company,
            jobTitle: topMatch.jobTitle,
            faceImageUrl: topMatch.faceImageUrl,
            confidence: topMatch.confidence,
          }
        : undefined;

      if (!bestMatch) {
        failureReason = 'PARTICIPANT_NOT_FOUND';
        return this.deny(
          'CHECKIN_PARTICIPANT_NOT_FOUND',
          'Face not recognized for this event. Please re-capture enrollment photo and try again.',
          422,
          context,
          totemId,
        );
      }

      // ── Confidence threshold ──────────────────────────────────────
      if (bestMatch.confidence < configuredConfidenceThreshold) {
        failureReason = 'LOW_CONFIDENCE';
        return this.deny('CHECKIN_LOW_CONFIDENCE', 'Confidence below threshold.', 400, context, totemId, {
          confidence: bestMatch.confidence,
          threshold: configuredConfidenceThreshold,
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
        failureReason = 'DUPLICATE';
        return this.deny('CHECKIN_DUPLICATE', 'Participant already checked in.', 409, context, totemId, {
          participantName: bestMatch.participantName,
        });
      }

      // ── FASE 3: Intelligent Cooldown Check (per-event scoped) ───────
      if (this.cooldownService) {
        const isInCooldown = await this.cooldownService.isPersonInCooldown(
          bestMatch.eventParticipantId,
          context.event.id,
        );

        if (isInCooldown) {
          const remaining = await this.cooldownService.getRemainingCooldownMs(
            bestMatch.eventParticipantId,
            context.event.id,
          );
          failureReason = 'COOLDOWN';
          return this.deny(
            'CHECKIN_PERSON_COOLDOWN',
            `Check-in blocked by anti-fraud cooldown. Try again in ${Math.ceil(remaining / 1000)}s.`,
            429,
            context,
            totemId,
            {
              participantName: bestMatch.participantName,
              remainingCooldownMs: remaining,
            },
          );
        }
      } else {
        // ── Fallback: Old fixed cooldown ──────────────────────────────
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
          failureReason = 'COOLDOWN';
          return this.deny(
            'CHECKIN_PERSON_COOLDOWN',
            'Check-in blocked by anti-fraud cooldown.',
            429,
            context,
            totemId,
          );
        }
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

      // ── FASE 3: Register successful check-in (resets cooldown) ────────
      if (this.cooldownService) {
        await this.cooldownService.registerSuccessfulCheckIn(bestMatch.eventParticipantId, context.event.id);
      }

      // ── Audit log: approved ───────────────────────────────────────
      await this.logAudit({
        action: 'CHECK_IN_APPROVED',
        description: `Check-in approved for ${bestMatch.participantName} with confidence ${bestMatch.confidence.toFixed(4)}`,
        metadata: {
          checkInId: checkIn.id,
          confidence: bestMatch.confidence,
          confidenceThreshold: configuredConfidenceThreshold,
          totemId,
          eventId: context.event.id,
          totemEventSubscriptionId: context.totemEventSubscriptionId,
          participantName: bestMatch.participantName,
          eventParticipantId: bestMatch.eventParticipantId,
          faceCount: input.faceCount,
          searchMethod: 'VECTOR_DB',
          ...(input.livenessScore !== undefined && { livenessScore: input.livenessScore }),
          ...(input.blinkDetected !== undefined && { blinkDetected: input.blinkDetected }),
          // NEW (Phase 4): Add tracking information
          ...(input.trackId !== undefined && { trackId: input.trackId }),
          ...(input.trackStability !== undefined && { trackStability: input.trackStability }),
          ...(input.historicalLivenessAvg !== undefined && { historicalLivenessAvg: input.historicalLivenessAvg }),
        },
        organizationId: context.organizationId,
        eventId: context.event.id,
      });

      // ── FASE 3: Record metrics (success) ──────────────────────────────
      if (this.metricsService) {
        await this.metricsService.recordCheckIn({
          totemEventSubscriptionId: context.totemEventSubscriptionId,
          eventId: context.event.id,
          organizationId: context.organizationId,
          latencyMs: Date.now() - startTime,
          confidence: bestMatch.confidence,
          success: true,
        });
      }

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
    } catch (error) {
      // ── FASE 3: Record metrics (failure on exception) ────────────────
      if (this.metricsService) {
        await this.metricsService.recordCheckIn({
          totemEventSubscriptionId: context.totemEventSubscriptionId,
          eventId: context.event.id,
          organizationId: context.organizationId,
          latencyMs: Date.now() - startTime,
          success: false,
          failureReason: failureReason || 'SYSTEM_ERROR',
        });
      }
      throw error;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private normalizeThreshold(value: number): number {
    if (!Number.isFinite(value)) {
      return 0.75;
    }

    return Math.max(MIN_SEARCH_THRESHOLD, Math.min(0.95, value));
  }

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
