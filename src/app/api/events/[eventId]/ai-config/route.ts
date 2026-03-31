import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

const aiConfigSchema = z.object({
  confidenceThreshold: z.number().min(0.3).max(0.99),
  detectionIntervalMs: z.number().int().min(100).max(5000),
  maxFaces: z.number().int().min(1).max(5),
  livenessDetection: z.boolean(),
  minFaceSize: z.number().int().min(32).max(600).default(80),
});

const DEFAULT_AI_CONFIG = {
  confidenceThreshold: 0.72,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: false,
  minFaceSize: 85,
  recommendedEmbeddingModel: 'Transformers.js ArcFace (512d)',
  recommendedDetectorModel: 'Browser FaceDetector API',
};

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

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

    return NextResponse.json(
      row
        ? {
            confidenceThreshold: row.confidence_threshold,
            detectionIntervalMs: row.detection_interval_ms,
            maxFaces: row.max_faces,
            livenessDetection: row.liveness_detection,
            minFaceSize: row.min_face_size,
            recommendedEmbeddingModel: DEFAULT_AI_CONFIG.recommendedEmbeddingModel,
            recommendedDetectorModel: DEFAULT_AI_CONFIG.recommendedDetectorModel,
          }
        : DEFAULT_AI_CONFIG,
      { status: 200 },
    );
  }),
);

export const PATCH = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = aiConfigSchema.parse(body);

      await prisma.$executeRaw`
        INSERT INTO event_ai_configs (
          event_id,
          confidence_threshold,
          detection_interval_ms,
          max_faces,
          liveness_detection,
          min_face_size,
          updated_at
        )
        VALUES (
          ${eventId},
          ${data.confidenceThreshold},
          ${data.detectionIntervalMs},
          ${data.maxFaces},
          ${data.livenessDetection},
          ${data.minFaceSize},
          NOW()
        )
        ON CONFLICT (event_id)
        DO UPDATE SET
          confidence_threshold = EXCLUDED.confidence_threshold,
          detection_interval_ms = EXCLUDED.detection_interval_ms,
          max_faces = EXCLUDED.max_faces,
          liveness_detection = EXCLUDED.liveness_detection,
          min_face_size = EXCLUDED.min_face_size,
          updated_at = NOW()
      `;

      return NextResponse.json(
        {
          ...data,
          recommendedEmbeddingModel: DEFAULT_AI_CONFIG.recommendedEmbeddingModel,
          recommendedDetectorModel: DEFAULT_AI_CONFIG.recommendedDetectorModel,
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);
