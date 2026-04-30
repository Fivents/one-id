import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

/**
 * POST /api/totem/metrics
 *
 * Records performance metrics from totem face recognition operations.
 * Used for monitoring and optimization.
 *
 * Request:
 * {
 *   timestamp: string (ISO)
 *   latencyMs: number
 *   confidence: number
 *   matched: boolean
 *   livenessScore?: number
 *   failureReason?: string
 *   detectionTimeMs?: number
 *   embeddingTimeMs?: number
 *   matchingTimeMs?: number
 * }
 */

const metricsSchema = z.object({
  timestamp: z.string().datetime().optional(),
  latencyMs: z.number().int().min(0).max(60000),
  confidence: z.number().min(0).max(1),
  matched: z.boolean(),
  livenessScore: z.number().min(0).max(1).optional(),
  failureReason: z.string().max(100).optional(),
  detectionTimeMs: z.number().int().min(0).optional(),
  embeddingTimeMs: z.number().int().min(0).optional(),
  matchingTimeMs: z.number().int().min(0).optional(),
});

// Batch metrics in memory before writing to DB
interface MetricsBatch {
  totemId: string;
  eventId: string;
  metrics: z.infer<typeof metricsSchema>[];
  lastFlush: number;
}

const metricsBatches = new Map<string, MetricsBatch>();
const BATCH_SIZE = 10;
const BATCH_FLUSH_INTERVAL_MS = 30000; // 30 seconds

export const POST = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        const body = await req.json();
        const data = metricsSchema.parse(body);

        // Get active context
        const context = await resolveActiveTotemEventContextByTotemId(totemId);
        if (!context) {
          return NextResponse.json({ received: false, reason: 'no_active_event' }, { status: 200 });
        }

        const eventId = context.event.id;
        const batchKey = `${totemId}:${eventId}`;

        // Add to batch
        let batch = metricsBatches.get(batchKey);
        if (!batch) {
          batch = {
            totemId,
            eventId,
            metrics: [],
            lastFlush: Date.now(),
          };
          metricsBatches.set(batchKey, batch);
        }

        batch.metrics.push(data);

        // Flush if batch is full or time elapsed
        const shouldFlush =
          batch.metrics.length >= BATCH_SIZE || Date.now() - batch.lastFlush > BATCH_FLUSH_INTERVAL_MS;

        if (shouldFlush) {
          await flushMetrics(batch, context.totemEventSubscriptionId);
          batch.metrics = [];
          batch.lastFlush = Date.now();
        }

        return NextResponse.json({ received: true, batchSize: batch.metrics.length }, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ received: false, error: error.issues[0]?.message }, { status: 400 });
        }

        console.error('[metrics] Error:', error);
        return NextResponse.json({ received: false }, { status: 500 });
      }
    }),
  ),
);

async function flushMetrics(batch: MetricsBatch, totemEventSubscriptionId: string): Promise<void> {
  if (batch.metrics.length === 0) return;

  try {
    // Aggregate metrics
    const totalLatency = batch.metrics.reduce((sum, m) => sum + m.latencyMs, 0);
    const avgLatency = Math.round(totalLatency / batch.metrics.length);

    const totalConfidence = batch.metrics.reduce((sum, m) => sum + m.confidence, 0);
    const avgConfidence = totalConfidence / batch.metrics.length;

    const successCount = batch.metrics.filter((m) => m.matched).length;
    const failureCount = batch.metrics.length - successCount;

    // Count failure reasons
    const failureReasons = batch.metrics
      .filter((m) => !m.matched && m.failureReason)
      .reduce(
        (acc, m) => {
          acc[m.failureReason!] = (acc[m.failureReason!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Update TotemEventSubscription stats
    await prisma.totemEventSubscription.update({
      where: { id: totemEventSubscriptionId },
      data: {
        lastCheckInAt: new Date(),
        totalCheckIns: { increment: batch.metrics.length },
        successCheckIns: { increment: successCount },
        avgCheckInLatencyMs: avgLatency,
        avgConfidence: avgConfidence,
      },
    });

    // If CheckInMetrics table exists, update hourly aggregates
    try {
      const hourStart = new Date();
      hourStart.setMinutes(0, 0, 0);

      await prisma.$executeRaw`
        INSERT INTO check_in_metrics (
          id, totem_event_subscription_id, hour_start,
          check_in_count, success_count, failure_count,
          avg_latency_ms, avg_confidence,
          low_confidence_count, cooldown_count, liveness_fail_count,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${totemEventSubscriptionId}::uuid,
          ${hourStart},
          ${batch.metrics.length},
          ${successCount},
          ${failureCount},
          ${avgLatency},
          ${avgConfidence},
          ${failureReasons['below_threshold'] || 0},
          ${failureReasons['cooldown'] || 0},
          ${failureReasons['liveness_failed'] || 0},
          NOW(),
          NOW()
        )
        ON CONFLICT (totem_event_subscription_id, hour_start)
        DO UPDATE SET
          check_in_count = check_in_metrics.check_in_count + ${batch.metrics.length},
          success_count = check_in_metrics.success_count + ${successCount},
          failure_count = check_in_metrics.failure_count + ${failureCount},
          avg_latency_ms = (check_in_metrics.avg_latency_ms + ${avgLatency}) / 2,
          avg_confidence = (check_in_metrics.avg_confidence + ${avgConfidence}) / 2,
          low_confidence_count = check_in_metrics.low_confidence_count + ${failureReasons['below_threshold'] || 0},
          cooldown_count = check_in_metrics.cooldown_count + ${failureReasons['cooldown'] || 0},
          liveness_fail_count = check_in_metrics.liveness_fail_count + ${failureReasons['liveness_failed'] || 0},
          updated_at = NOW()
      `;
    } catch {
      // CheckInMetrics table might not exist yet
    }

    console.info(`[metrics] Flushed ${batch.metrics.length} metrics for totem ${batch.totemId}`);
  } catch (error) {
    console.error('[metrics] Flush error:', error);
  }
}
