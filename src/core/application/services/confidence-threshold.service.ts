import type {
  AdaptiveThresholdResult,
  IConfidenceThresholdService,
  ThresholdAdaptationInput,
} from '@/core/domain/contracts/confidence-threshold.service';

export class ConfidenceThresholdService implements IConfidenceThresholdService {
  private readonly baseThreshold = 0.7;

  async calculateAdaptiveThreshold(input: ThresholdAdaptationInput): Promise<AdaptiveThresholdResult> {
    // Factor 1: Participant count (more people = slightly lower threshold)
    // Rationale: With more faces, embeddings more spread out in vector space
    // Scale: 0.9 (min, -10%) at 10k participants to 1.0 at 0 participants
    const participantCountFactor = Math.max(0.9, 1.0 - (input.eventParticipantCount / 10000) * 0.1);

    // Factor 2: Enrollment age (older = confidence decays)
    // Rationale: Lighting changes, aging, face recognition model drift
    // Scale: 0.8 (min, -20%) at 1 year old to 1.0 for fresh enrollments
    const enrollmentAgeFactor = Math.max(0.8, 1.0 - (input.enrollmentTimeframeHours / 8760) * 0.2);

    // Factor 3: Quality distribution (from historical accuracy)
    const qualityDistributionFactor = this.computeQualityFactor(input.recentMatchQualityScores);

    // Apply all factors multiplicatively
    const recommendedThreshold =
      this.baseThreshold * participantCountFactor * enrollmentAgeFactor * qualityDistributionFactor;

    return {
      recommendedThreshold: Math.max(0.5, Math.min(0.9, recommendedThreshold)),
      reasoning: [
        `Base threshold: ${this.baseThreshold.toFixed(3)}`,
        `Participant factor: ${participantCountFactor.toFixed(3)} (${input.eventParticipantCount} people)`,
        `Enrollment age factor: ${enrollmentAgeFactor.toFixed(3)} (${input.enrollmentTimeframeHours}h old)`,
        `Quality distribution factor: ${qualityDistributionFactor.toFixed(3)}`,
      ],
      baseThreshold: this.baseThreshold,
      adjustmentFactors: {
        participantCountFactor,
        enrollmentAgeFactor,
        qualityDistributionFactor,
      },
    };
  }

  suggestRange(
    enrollmentCount: number,
    _eventParticipantCount: number,
  ): { min: number; recommended: number; max: number } {
    // Conservative: few enrollments = higher threshold (stricter)
    const recommendedThreshold = enrollmentCount < 100 ? 0.75 : 0.7;

    return {
      min: Math.max(0.5, recommendedThreshold - 0.15),
      recommended: recommendedThreshold,
      max: Math.min(0.9, recommendedThreshold + 0.15),
    };
  }

  private computeQualityFactor(scores: number[]): number {
    if (scores.length === 0) return 1.0;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // High variance = adjust down (less predictable)
    // High mean = adjust up (good quality)
    // Range: 0.9 to 1.1
    return Math.max(0.9, Math.min(1.1, avg - stdDev * 0.1));
  }
}
