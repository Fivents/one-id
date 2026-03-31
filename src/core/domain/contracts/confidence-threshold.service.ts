/**
 * ConfidenceThresholdService
 *
 * Implements adaptive confidence thresholds for facial recognition check-ins.
 * Thresholds are dynamically adjusted based on:
 * - Number of participants in the event
 * - Age of enrollment data
 * - Historical quality distribution
 */

export interface ThresholdAdaptationInput {
  eventParticipantCount: number;
  totalEnrollments: number;
  enrollmentTimeframeHours: number;
  recentMatchQualityScores: number[];
  eventId: string;
  organizationId: string;
}

export interface AdaptiveThresholdResult {
  recommendedThreshold: number;
  reasoning: string[];
  baseThreshold: number;
  adjustmentFactors: {
    participantCountFactor: number;
    enrollmentAgeFactor: number;
    qualityDistributionFactor: number;
  };
}

export interface IConfidenceThresholdService {
  /**
   * Calculate adaptive confidence threshold based on event metrics
   */
  calculateAdaptiveThreshold(input: ThresholdAdaptationInput): Promise<AdaptiveThresholdResult>;

  /**
   * Suggest recommended threshold range for an event
   */
  suggestRange(
    enrollmentCount: number,
    eventParticipantCount: number,
  ): { min: number; recommended: number; max: number };
}
