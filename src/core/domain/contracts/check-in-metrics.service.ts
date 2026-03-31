/**
 * CheckInMetricsService
 *
 * Collects and aggregates facial recognition check-in metrics.
 * Metrics are buffered in-memory and flushed to database every 5 minutes.
 * Provides hourly snapshots with:
 * - Check-in counts (success/failure)
 * - Latency analysis (average, p95)
 * - Confidence distribution
 * - Failure reasons breakdown
 */

export interface MetricsSnapshot {
  totemEventSubscriptionId: string;
  eventId: string;
  checkInCount: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgConfidence: number;
  failureBreakdown: {
    lowQualityCount: number;
    lowConfidenceCount: number;
    cooldownCount: number;
    livenessFailCount: number;
  };
}

export interface ICheckInMetricsService {
  /**
   * Record an individual check-in (success or failure)
   * Non-blocking: uses in-memory buffer
   */
  recordCheckIn(data: {
    totemEventSubscriptionId: string;
    eventId: string;
    organizationId: string;
    latencyMs: number;
    confidence?: number;
    success: boolean;
    failureReason?: string;
  }): Promise<void>;

  /**
   * Get hourly metrics snapshot for a specific hour
   * If hour not specified, returns current hour
   */
  getMetricsSnapshot(totemEventSubscriptionId: string, hour?: Date): Promise<MetricsSnapshot | null>;

  /**
   * Get metrics history for last N hours
   * Ordered chronologically (oldest first)
   */
  getMetricsHistory(totemEventSubscriptionId: string, hoursBack: number): Promise<MetricsSnapshot[]>;
}
