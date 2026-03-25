import { prisma } from '@/core/infrastructure/prisma-client';

export interface EventAIConfigDTO {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  livenessThreshold: number;
  minFaceSize: number;
  cooldownSeconds: number;
  efSearch: number;
  topKCandidates: number;
  recommendedEmbeddingModel: string;
  recommendedDetectorModel: string;
}

export interface ActiveTotemContext {
  totem: {
    id: string;
    name: string;
  };
  organizationId: string;
  event: {
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
  };
  totemOrganizationSubscriptionId: string;
  totemEventSubscriptionId: string;
  aiConfig: EventAIConfigDTO;
}

const DEFAULT_AI_CONFIG: EventAIConfigDTO = {
  confidenceThreshold: 0.62,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: true,
  livenessThreshold: 0.7,
  minFaceSize: 80,
  cooldownSeconds: 8,
  efSearch: 64,
  topKCandidates: 5,
  recommendedEmbeddingModel: 'InsightFace ArcFace (w600k_r50)',
  recommendedDetectorModel: 'SCRFD 10G (scrfd_10g_bnkps)',
};

async function getEventAIConfig(eventId: string): Promise<EventAIConfigDTO> {
  const rows = await prisma.$queryRaw<
    Array<{
      confidence_threshold: number;
      detection_interval_ms: number;
      max_faces: number;
      liveness_detection: boolean;
      liveness_threshold: number | null;
      min_face_size: number;
      cooldown_seconds: number | null;
      ef_search: number | null;
      top_k_candidates: number | null;
    }>
  >`
    SELECT
      confidence_threshold,
      detection_interval_ms,
      max_faces,
      liveness_detection,
      liveness_threshold,
      min_face_size,
      cooldown_seconds,
      ef_search,
      top_k_candidates
    FROM event_ai_configs
    WHERE event_id = ${eventId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return DEFAULT_AI_CONFIG;
  }

  return {
    confidenceThreshold: row.confidence_threshold,
    detectionIntervalMs: row.detection_interval_ms,
    maxFaces: row.max_faces,
    livenessDetection: row.liveness_detection,
    livenessThreshold: row.liveness_threshold ?? DEFAULT_AI_CONFIG.livenessThreshold,
    minFaceSize: row.min_face_size,
    cooldownSeconds: row.cooldown_seconds ?? DEFAULT_AI_CONFIG.cooldownSeconds,
    efSearch: row.ef_search ?? DEFAULT_AI_CONFIG.efSearch,
    topKCandidates: row.top_k_candidates ?? DEFAULT_AI_CONFIG.topKCandidates,
    recommendedEmbeddingModel: DEFAULT_AI_CONFIG.recommendedEmbeddingModel,
    recommendedDetectorModel: DEFAULT_AI_CONFIG.recommendedDetectorModel,
  };
}

async function resolveFromWhere(where: { id?: string; accessCode?: string }): Promise<ActiveTotemContext | null> {
  const now = new Date();

  const totem = await prisma.totem.findFirst({
    where: {
      ...where,
      deletedAt: null,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      organizationSubscriptions: {
        where: {
          startsAt: { lte: now },
          endsAt: { gte: now },
          revokedAt: null,
        },
        select: {
          id: true,
          organizationId: true,
          eventSubscriptions: {
            where: {
              startsAt: { lte: now },
              endsAt: { gte: now },
              revokedAt: null,
              event: {
                status: 'ACTIVE',
                startsAt: { lte: now },
                endsAt: { gte: now },
                deletedAt: null,
              },
            },
            select: {
              id: true,
              event: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
            orderBy: {
              startsAt: 'asc',
            },
            take: 1,
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
      },
    },
  });

  if (!totem) {
    return null;
  }

  const orgSubscription = totem.organizationSubscriptions.find((sub) => sub.eventSubscriptions.length > 0);
  const eventSubscription = orgSubscription?.eventSubscriptions[0];

  if (!orgSubscription || !eventSubscription) {
    return null;
  }

  const aiConfig = await getEventAIConfig(eventSubscription.event.id);

  return {
    totem: {
      id: totem.id,
      name: totem.name,
    },
    organizationId: orgSubscription.organizationId,
    event: {
      id: eventSubscription.event.id,
      name: eventSubscription.event.name,
      startsAt: eventSubscription.event.startsAt,
      endsAt: eventSubscription.event.endsAt,
    },
    totemOrganizationSubscriptionId: orgSubscription.id,
    totemEventSubscriptionId: eventSubscription.id,
    aiConfig,
  };
}

export async function resolveActiveTotemEventContextByKey(key: string): Promise<ActiveTotemContext | null> {
  return resolveFromWhere({ accessCode: key });
}

export async function resolveActiveTotemEventContextByTotemId(totemId: string): Promise<ActiveTotemContext | null> {
  return resolveFromWhere({ id: totemId });
}

export { DEFAULT_AI_CONFIG };
