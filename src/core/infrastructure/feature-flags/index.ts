/**
 * Feature Flags for Phase 1 implementation
 *
 * Strategy:
 * 1. Deploy with all flags = false (zero impact)
 * 2. Warmup in staging with flags = true (5 days)
 * 3. Canary: 5% users (1 day)
 * 4. Rolling: 25% → 50% → 100% (1 day each)
 * 5. Stabilize: Monitor 1 week before Phase 2
 *
 * Environment variables control these flags via process.env
 */

export const featureFlags = {
  /**
   * Vector Search via pgvector.
   * When enabled: Uses O(log n) vector search instead of O(n*m) linear search.
   * Performance gain: 3-10x faster matching on large events.
   * Rollback: Can disable instantly, falls back to linear search.
   */
  VECTOR_DB_ENABLED: process.env.FEATURE_VECTOR_DB_ENABLED === 'true',

  /**
   * Face Quality Assessment during enrollment.
   * When enabled: Validates face quality score (threshold 0.65).
   * UX impact: May reject low-quality faces, requiring user retry.
   * Improvement: Reduces false negatives by ~5%.
   */
  FACE_QUALITY_CHECK_ENABLED: process.env.FEATURE_FACE_QUALITY_CHECK_ENABLED === 'true',

  /**
   * Multimodal Liveness Detection.
   * When enabled: Uses anti-spoof + blink + head movement detection.
   * When disabled: Falls back to simple liveness checks.
   * Security: Prevents presentation attacks (video replay, mask).
   */
  LIVENESS_MULTIMODAL_ENABLED: process.env.FEATURE_LIVENESS_MULTIMODAL_ENABLED === 'true',

  /**
   * Face Tracking across frames (Phase 4).
   * When enabled: Tracks faces with IoU-based assignment across frames.
   * Anti-spoofing: Detects replay attacks via motion validation.
   * Accuracy: Aggregates liveness from last 5 frames.
   */
  FACE_TRACKING_ENABLED: process.env.FEATURE_FACE_TRACKING_ENABLED === 'true',

  /**
   * SCRFD 10G detector (Phase 4).
   * When enabled: Uses SCRFD detector instead of Human.js.
   * Performance: ~50% faster (20-30ms vs 40-80ms).
   * Accuracy: Better on small faces (<80px).
   */
  SCRFD_DETECTOR_ENABLED: process.env.FEATURE_SCRFD_DETECTOR_ENABLED === 'true',

  /**
   * Detector Fallback (Phase 4).
   * When enabled: SCRFD → Human.js fallback on detection failure.
   * Resilience: Ensures detection always succeeds.
   * Impact: Minimal (fallback only on error).
   */
  DETECTOR_FALLBACK_ENABLED: process.env.FEATURE_DETECTOR_FALLBACK_ENABLED === 'true',

  /**
   * Embedding Encryption at Rest (Phase 5).
   * When enabled: All face embeddings encrypted with AES-256-GCM in database.
   * Security: Protects embeddings if database is compromised.
   * Impact: ~2-3ms per encryption/decryption operation.
   */
  EMBEDDING_ENCRYPTION_ENABLED: process.env.FEATURE_EMBEDDING_ENCRYPTION_ENABLED === 'true',
} as const;

/**
 * Log feature flag status (called at startup).
 */
export function logFeatureFlagStatus(): void {
  if (typeof console !== 'undefined') {
    console.log('[Feature Flags Status]', {
      VECTOR_DB_ENABLED: featureFlags.VECTOR_DB_ENABLED,
      FACE_QUALITY_CHECK_ENABLED: featureFlags.FACE_QUALITY_CHECK_ENABLED,
      LIVENESS_MULTIMODAL_ENABLED: featureFlags.LIVENESS_MULTIMODAL_ENABLED,
      FACE_TRACKING_ENABLED: featureFlags.FACE_TRACKING_ENABLED,
      SCRFD_DETECTOR_ENABLED: featureFlags.SCRFD_DETECTOR_ENABLED,
      DETECTOR_FALLBACK_ENABLED: featureFlags.DETECTOR_FALLBACK_ENABLED,
      EMBEDDING_ENCRYPTION_ENABLED: featureFlags.EMBEDDING_ENCRYPTION_ENABLED,
    });
  }
}

// Type-safe way to access flags
export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
