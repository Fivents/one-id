import { prisma } from '@/core/infrastructure/prisma-client';

export interface EventAIConfigDTO {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
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
  confidenceThreshold: 0.75,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: false,
  minFaceSize: 80,
  recommendedEmbeddingModel: 'InsightFace Buffalo_L (ArcFace, 512d)',
  recommendedDetectorModel: 'SCRFD 10G (2026 production baseline)',
};

async function getEventAIConfig(eventId: string): Promise<EventAIConfigDTO> {
  const rows = await prisma.$queryRaw<
    Array<{
      confidence_threshold: number;
      detection_interval_ms: number;
      max_faces: number;
      liveness_detection: boolean;
      min_face_size: number;
    }>
  >`
    SELECT
      confidence_threshold,
      detection_interval_ms,
      max_faces,
      liveness_detection,
      min_face_size
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
    minFaceSize: row.min_face_size,
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
