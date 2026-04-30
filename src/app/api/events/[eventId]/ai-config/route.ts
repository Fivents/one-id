import { NextRequest, NextResponse } from 'next/server';

import { randomUUID } from 'crypto';
import { z } from 'zod/v4';

import { AI_CONFIG_CONSTRAINTS, DEFAULT_AI_CONFIG } from '@/core/domain/constants/ai-config.constants';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

const aiConfigSchema = z.object({
  confidenceThreshold: z
    .number()
    .min(AI_CONFIG_CONSTRAINTS.confidenceThreshold.min)
    .max(AI_CONFIG_CONSTRAINTS.confidenceThreshold.max),
  detectionIntervalMs: z
    .number()
    .int()
    .min(AI_CONFIG_CONSTRAINTS.detectionIntervalMs.min)
    .max(AI_CONFIG_CONSTRAINTS.detectionIntervalMs.max),
  maxFaces: z.number().int().min(AI_CONFIG_CONSTRAINTS.maxFaces.min).max(AI_CONFIG_CONSTRAINTS.maxFaces.max),
  livenessDetection: z.boolean(),
  minFaceSize: z.number().int().min(AI_CONFIG_CONSTRAINTS.minFaceSize.min).max(AI_CONFIG_CONSTRAINTS.minFaceSize.max),
});

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

      // Use Prisma's upsert for proper handling with automatic id generation
      await prisma.eventAIConfig.upsert({
        where: { eventId },
        create: {
          id: randomUUID(),
          eventId,
          confidenceThreshold: data.confidenceThreshold,
          detectionIntervalMs: data.detectionIntervalMs,
          maxFaces: data.maxFaces,
          livenessDetection: data.livenessDetection,
          minFaceSize: data.minFaceSize,
          livenessThreshold: 0.7,
          efSearch: 64,
          topKCandidates: 5,
          cooldownSeconds: 8,
        },
        update: {
          confidenceThreshold: data.confidenceThreshold,
          detectionIntervalMs: data.detectionIntervalMs,
          maxFaces: data.maxFaces,
          livenessDetection: data.livenessDetection,
          minFaceSize: data.minFaceSize,
        },
      });

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);
