import type { ICheckInMetricsService, MetricsSnapshot } from '@/core/domain/contracts/check-in-metrics.service';
import type { PrismaClient } from '@/generated/prisma/client';

interface InMemoryBuffer {
  totemEventSubscriptionId: string;
  eventId: string;
  organizationId: string;
  hour: Date;
  checkIns: Array<{ latencyMs: number; confidence?: number; success: boolean }>;
  failureBreakdown: {
    lowQualityCount: number;
    lowConfidenceCount: number;
    cooldownCount: number;
    livenessFailCount: number;
  };
}

export class CheckInMetricsService implements ICheckInMetricsService {
  private readonly buffers = new Map<string, InMemoryBuffer>();
  private readonly flushInterval = 300_000; // 5 minutes
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(private readonly db: PrismaClient) {
    this.startPeriodicFlush();
  }

  async recordCheckIn(data: {
    totemEventSubscriptionId: string;
    eventId: string;
    organizationId: string;
    latencyMs: number;
    confidence?: number;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    const hour = this.getHourBucket(new Date());
    const bufferKey = `${data.totemEventSubscriptionId}:${hour.toISOString()}`;

    let buffer = this.buffers.get(bufferKey);
    if (!buffer) {
      buffer = {
        totemEventSubscriptionId: data.totemEventSubscriptionId,
        eventId: data.eventId,
        organizationId: data.organizationId,
        hour,
        checkIns: [],
        failureBreakdown: {
          lowQualityCount: 0,
          lowConfidenceCount: 0,
          cooldownCount: 0,
          livenessFailCount: 0,
        },
      };
      this.buffers.set(bufferKey, buffer);
    }

    buffer.checkIns.push({
      latencyMs: data.latencyMs,
      confidence: data.confidence,
      success: data.success,
    });

    // Track failure reason
    if (!data.success) {
      switch (data.failureReason) {
        case 'LOW_QUALITY':
          buffer.failureBreakdown.lowQualityCount++;
          break;
        case 'LOW_CONFIDENCE':
          buffer.failureBreakdown.lowConfidenceCount++;
          break;
        case 'COOLDOWN':
          buffer.failureBreakdown.cooldownCount++;
          break;
        case 'LIVENESS_FAILED':
          buffer.failureBreakdown.livenessFailCount++;
          break;
      }
    }
  }

  async getMetricsSnapshot(totemEventSubscriptionId: string, hour?: Date): Promise<MetricsSnapshot | null> {
    const targetHour = hour ? this.getHourBucket(hour) : this.getHourBucket(new Date());

    const metrics = await this.db.checkInMetrics.findUnique({
      where: {
        totemEventSubscriptionId_hour: {
          totemEventSubscriptionId,
          hour: targetHour,
        },
      },
    });

    if (!metrics) {
      return null;
    }

    return {
      totemEventSubscriptionId: metrics.totemEventSubscriptionId,
      eventId: metrics.eventId,
      checkInCount: metrics.checkInCount,
      successCount: metrics.successCount,
      failureCount: metrics.failureCount,
      avgLatencyMs: metrics.avgLatencyMs,
      p95LatencyMs: metrics.p95LatencyMs,
      avgConfidence: metrics.avgConfidence,
      failureBreakdown: {
        lowQualityCount: metrics.lowQualityCount,
        lowConfidenceCount: metrics.lowConfidenceCount,
        cooldownCount: metrics.cooldownCount,
        livenessFailCount: metrics.livenessFailCount,
      },
    };
  }

  async getMetricsHistory(totemEventSubscriptionId: string, hoursBack: number): Promise<MetricsSnapshot[]> {
    const now = new Date();
    const since = new Date(now.getTime() - hoursBack * 3600000);

    const metrics = await this.db.checkInMetrics.findMany({
      where: {
        totemEventSubscriptionId,
        hour: { gte: since, lte: now },
      },
      orderBy: { hour: 'asc' },
    });

    return metrics.map((m) => ({
      totemEventSubscriptionId: m.totemEventSubscriptionId,
      eventId: m.eventId,
      checkInCount: m.checkInCount,
      successCount: m.successCount,
      failureCount: m.failureCount,
      avgLatencyMs: m.avgLatencyMs,
      p95LatencyMs: m.p95LatencyMs,
      avgConfidence: m.avgConfidence,
      failureBreakdown: {
        lowQualityCount: m.lowQualityCount,
        lowConfidenceCount: m.lowConfidenceCount,
        cooldownCount: m.cooldownCount,
        livenessFailCount: m.livenessFailCount,
      },
    }));
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics().catch((err) => {
        console.error('[CheckInMetricsService] Flush error:', err);
      });
    }, this.flushInterval);
  }

  private async flushMetrics(): Promise<void> {
    const entries = Array.from(this.buffers.entries());

    for (const [key, buffer] of entries) {
      if (buffer.checkIns.length === 0) continue;

      const snapshot = this.computeSnapshot(buffer);

      await this.db.checkInMetrics.upsert({
        where: {
          totemEventSubscriptionId_hour: {
            totemEventSubscriptionId: buffer.totemEventSubscriptionId,
            hour: buffer.hour,
          },
        },
        update: snapshot,
        create: {
          ...snapshot,
          totemEventSubscriptionId: buffer.totemEventSubscriptionId,
          eventId: buffer.eventId,
          organizationId: buffer.organizationId,
          hour: buffer.hour,
        },
      });

      this.buffers.delete(key);
    }
  }

  private computeSnapshot(buffer: InMemoryBuffer) {
    const latencies = buffer.checkIns.map((c) => c.latencyMs);
    const confidences = buffer.checkIns.filter((c) => c.confidence !== undefined).map((c) => c.confidence!);

    return {
      checkInCount: buffer.checkIns.length,
      successCount: buffer.checkIns.filter((c) => c.success).length,
      failureCount: buffer.checkIns.filter((c) => !c.success).length,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95LatencyMs: this.calculatePercentile(latencies, 0.95),
      avgConfidence: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
      ...buffer.failureBreakdown,
    };
  }

  private getHourBucket(date: Date): Date {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  destructor(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}
