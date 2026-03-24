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
const MINIMUM_QUALITY_SCORE = 0.65; // Minimum face quality for matching
const VECTOR_SEARCH_RELAXATION = 0.2;
const MIN_SEARCH_THRESHOLD = 0.5;
const MAX_ACCEPTANCE_RELAXATION = 0.06;
const MIN_ACCEPTANCE_THRESHOLD = 0.62;
const RELAXED_MIN_MARGIN_FROM_SECOND = 0.03;

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
      if (context.aiConfig.livenessDetection && (input.livenessScore ?? 0) < 0.5) {
        failureReason = 'LIVENESS_FAILED';
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
      let bestMatch: MatchCandidate | undefined;
      let secondBestConfidence: number | undefined;
      const configuredConfidenceThreshold = this.normalizeThreshold(context.aiConfig.confidenceThreshold);

      if (this.vectorDbRepository) {
        // ── PHASE 1: Use Vector Search (O(log n)) ────────────────────
        const searchResults = await this.vectorDbRepository.searchTopK({
          embedding: probeEmbedding,
          eventId: context.event.id,
          organizationId: context.organizationId,
          k: 5, // Return top 5 candidates
          threshold: this.getSearchThreshold(configuredConfidenceThreshold),
        });

        if (searchResults.length > 0) {
          const topMatch = searchResults[0];
          const runnerUp = searchResults[1];

          bestMatch = {
            eventParticipantId: topMatch.eventParticipantId,
            participantName: topMatch.personName,
            company: topMatch.company,
            jobTitle: topMatch.jobTitle,
            faceImageUrl: topMatch.faceImageUrl,
            confidence: topMatch.confidence,
          };

          secondBestConfidence = runnerUp?.confidence;
        }
      }

      if (!bestMatch || bestMatch.confidence < configuredConfidenceThreshold) {
        // Safety net: keep check-in operational even if embedding_vector is missing or stale.
        const fallback = await this.findBestMatchWithLegacyLoop(probeEmbedding, context.event.id);

        if (fallback.bestMatch && (!bestMatch || fallback.bestMatch.confidence > bestMatch.confidence)) {
          bestMatch = fallback.bestMatch;
          secondBestConfidence = fallback.secondBestConfidence;
        }
      }

      if (!bestMatch) {
        failureReason = 'PARTICIPANT_NOT_FOUND';
        return this.deny('CHECKIN_PARTICIPANT_NOT_FOUND', 'Participant not found.', 404, context, totemId);
      }

      const thresholdDecision = this.resolveThresholdDecision(
        configuredConfidenceThreshold,
        bestMatch.confidence,
        secondBestConfidence,
      );

      // ── Confidence threshold ──────────────────────────────────────
      if (bestMatch.confidence < thresholdDecision.acceptanceThreshold) {
        failureReason = 'LOW_CONFIDENCE';
        return this.deny('CHECKIN_LOW_CONFIDENCE', 'Confidence below threshold.', 400, context, totemId, {
          confidence: bestMatch.confidence,
          threshold: thresholdDecision.acceptanceThreshold,
          configuredThreshold: configuredConfidenceThreshold,
          thresholdMode: thresholdDecision.mode,
          secondBestConfidence,
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
          return this.deny('CHECKIN_PERSON_COOLDOWN', 'Check-in blocked by anti-fraud cooldown.', 429, context, totemId);
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
        await this.cooldownService.registerSuccessfulCheckIn(
          bestMatch.eventParticipantId,
          context.event.id,
        );
      }

      // ── Audit log: approved ───────────────────────────────────────
      await this.logAudit({
        action: 'CHECK_IN_APPROVED',
        description: `Check-in approved for ${bestMatch.participantName} with confidence ${bestMatch.confidence.toFixed(4)}`,
        metadata: {
          checkInId: checkIn.id,
          confidence: bestMatch.confidence,
          confidenceThreshold: thresholdDecision.acceptanceThreshold,
          configuredThreshold: configuredConfidenceThreshold,
          thresholdMode: thresholdDecision.mode,
          secondBestConfidence,
          totemId,
          eventId: context.event.id,
          totemEventSubscriptionId: context.totemEventSubscriptionId,
          participantName: bestMatch.participantName,
          eventParticipantId: bestMatch.eventParticipantId,
          faceCount: input.faceCount,
          searchMethod: this.vectorDbRepository ? 'VECTOR_DB' : 'LEGACY_LOOP',
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

  private cosineSimilarity(a: Buffer, b: Buffer): number {
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

  private async findBestMatchWithLegacyLoop(
    probeEmbedding: number[],
    eventId: string,
  ): Promise<{ bestMatch?: MatchCandidate; secondBestConfidence?: number }> {
    const participants = await this.db.eventParticipant.findMany({
      where: {
        eventId,
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
                faceQualityScore: true,
              },
            },
          },
        },
      },
    });

    const participantCandidates = new Map<string, MatchCandidate>();
    const probeBuffer = Buffer.from(new Float32Array(probeEmbedding).buffer);

    for (const participant of participants) {
      for (const face of participant.person.faces) {
        const totalTemplatesForPerson = participant.person.faces.length;

        if (
          totalTemplatesForPerson === 1 &&
          face.faceQualityScore !== null &&
          face.faceQualityScore < MINIMUM_QUALITY_SCORE
        ) {
          continue;
        }

        const confidence = this.cosineSimilarity(Buffer.from(face.embedding), probeBuffer);
        const previous = participantCandidates.get(participant.id);

        if (!previous || confidence > previous.confidence) {
          participantCandidates.set(participant.id, {
            eventParticipantId: participant.id,
            participantName: participant.person.name,
            company: participant.company,
            jobTitle: participant.jobTitle,
            faceImageUrl: face.imageUrl,
            confidence,
          });
        }
      }
    }

    const sortedCandidates = Array.from(participantCandidates.values()).sort((a, b) => b.confidence - a.confidence);

    return {
      bestMatch: sortedCandidates[0],
      secondBestConfidence: sortedCandidates[1]?.confidence,
    };
  }

  private normalizeThreshold(value: number): number {
    if (!Number.isFinite(value)) {
      return 0.75;
    }

    return Math.max(MIN_SEARCH_THRESHOLD, Math.min(0.95, value));
  }

  private getSearchThreshold(configuredThreshold: number): number {
    return Math.max(MIN_SEARCH_THRESHOLD, configuredThreshold - VECTOR_SEARCH_RELAXATION);
  }

  private resolveThresholdDecision(
    configuredThreshold: number,
    bestConfidence: number,
    secondBestConfidence?: number,
  ): { acceptanceThreshold: number; mode: 'STRICT' | 'RELAXED_NEAR_MATCH' } {
    if (bestConfidence >= configuredThreshold) {
      return { acceptanceThreshold: configuredThreshold, mode: 'STRICT' };
    }

    const relaxedThreshold = Math.max(
      MIN_ACCEPTANCE_THRESHOLD,
      configuredThreshold - MAX_ACCEPTANCE_RELAXATION,
    );

    const isNearThreshold = bestConfidence >= relaxedThreshold;

    if (!isNearThreshold) {
      return { acceptanceThreshold: configuredThreshold, mode: 'STRICT' };
    }

    if (secondBestConfidence === undefined) {
      // Single candidate only gets minor tolerance to reduce false accepts.
      const singleCandidateThreshold = Math.max(relaxedThreshold, configuredThreshold - 0.02);

      if (bestConfidence >= singleCandidateThreshold) {
        return { acceptanceThreshold: singleCandidateThreshold, mode: 'RELAXED_NEAR_MATCH' };
      }

      return { acceptanceThreshold: configuredThreshold, mode: 'STRICT' };
    }

    const confidenceGap = bestConfidence - secondBestConfidence;

    if (confidenceGap >= RELAXED_MIN_MARGIN_FROM_SECOND) {
      return { acceptanceThreshold: relaxedThreshold, mode: 'RELAXED_NEAR_MATCH' };
    }

    return { acceptanceThreshold: configuredThreshold, mode: 'STRICT' };
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
