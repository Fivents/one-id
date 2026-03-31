import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

/**
 * GET /api/totem/event-config
 *
 * Returns the AI configuration for the current event.
 * Totems should call this on initialization and periodically (every 5 minutes).
 *
 * Response:
 * {
 *   eventId: string
 *   eventName: string
 *   confidenceThreshold: number
 *   detectionIntervalMs: number
 *   maxFaces: number
 *   minFaceSize: number
 *   livenessEnabled: boolean
 *   livenessThreshold: number
 *   efSearch: number
 *   topKCandidates: number
 *   cooldownSeconds: number
 * }
 */

// Simple in-memory cache for event config
const configCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const GET = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        // Check cache first
        const cacheKey = `config:${totemId}`;
        const cached = configCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return NextResponse.json(cached.data, {
            status: 200,
            headers: {
              'Cache-Control': 'private, max-age=300',
              'X-Cache': 'HIT',
            },
          });
        }

        // Get active context
        const context = await resolveActiveTotemEventContextByTotemId(totemId);
        if (!context) {
          return NextResponse.json(
            {
              error: 'No active event assigned to this totem.',
              code: 'TOTEM_NO_ACTIVE_EVENT',
            },
            { status: 403 },
          );
        }

        const { event, aiConfig } = context;

        // Build response with all config values
        const response = {
          eventId: event.id,
          eventName: event.name,
          eventStartsAt: event.startsAt,
          eventEndsAt: event.endsAt,
          checkinMethods: {
            faceEnabled: event.faceEnabled,
            qrEnabled: event.qrEnabled,
            codeEnabled: event.codeEnabled,
          },

          // Detection settings
          confidenceThreshold: aiConfig.confidenceThreshold,
          detectionIntervalMs: aiConfig.detectionIntervalMs,
          maxFaces: aiConfig.maxFaces,
          minFaceSize: aiConfig.minFaceSize,

          // Liveness settings
          livenessEnabled: aiConfig.livenessDetection,
          livenessThreshold: aiConfig.livenessThreshold,

          // Vector search settings
          efSearch: aiConfig.efSearch,
          topKCandidates: aiConfig.topKCandidates,

          // Anti-fraud settings
          cooldownSeconds: aiConfig.cooldownSeconds,

          // Recommended models (for client-side reference)
          recommendedModels: {
            detector: 'FaceDetector API',
            embedder: 'arcface/model.onnx',
          },

          // Timestamp for cache validation
          generatedAt: new Date().toISOString(),
        };

        // Update cache
        configCache.set(cacheKey, {
          data: response,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return NextResponse.json(response, {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'MISS',
          },
        });
      } catch (error: unknown) {
        console.error('[event-config] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }),
  ),
);
