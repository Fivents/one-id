/**
 * Default AI configuration values shared between frontend and backend.
 * These values are used when no custom configuration exists for an event.
 */
export const DEFAULT_AI_CONFIG = {
  confidenceThreshold: 0.72,
  detectionIntervalMs: 500,
  maxFaces: 1,
  livenessDetection: false,
  minFaceSize: 85,
} as const;

/**
 * AI config validation constraints
 */
export const AI_CONFIG_CONSTRAINTS = {
  confidenceThreshold: { min: 0.3, max: 0.99, step: 0.01 },
  detectionIntervalMs: { min: 100, max: 5000, step: 50 },
  maxFaces: { min: 1, max: 5, step: 1 },
  minFaceSize: { min: 32, max: 600, step: 1 },
} as const;

export type AIConfig = {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
};
