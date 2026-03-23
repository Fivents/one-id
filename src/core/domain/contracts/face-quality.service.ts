/**
 * Face Quality Assessment Service Interface
 *
 * Validates the quality of detected faces during enrollment and check-in.
 * Ensures only high-quality faces are used for matching to reduce false negatives.
 *
 * Quality scoring is based on NIST FRVT recommendations:
 * - Total of 5 dimensions analyzed
 * - Weighted average: 0-1 score
 * - Threshold 0.65 balances UX with accuracy
 */

export interface FaceQualityScore {
  // Individual quality metrics (0-1)
  brightness: number; // -1 (too dark) to 1 (too bright), 0 is optimal
  blurriness: number; // 0 (sharp) to 1 (blurry)

  headPose: {
    yaw: number; // Head rotation left-right (radians)
    pitch: number; // Head rotation up-down
    roll: number; // Head tilt left-right
  };

  faceSize: number; // Face width in pixels

  landmarks: {
    confidence: number[]; // 468 landmark confidence scores
    meanConfidence: number; // Average confidence across all landmarks
  };

  // Final composite score
  overallScore: number; // Weighted average (0-1)
  // Weights: brightness (0.2) + blurriness (0.2) + headPose (0.2) + faceSize (0.2) + landmarks (0.2)

  // Additional metadata
  assessmentDetails: {
    timestamp: Date;
    passed: boolean;
    failures: string[]; // List of failed quality checks
  };
}

export interface IFaceQualityService {
  /**
   * Assess face quality from detected face data.
   * Analyzes multiple dimensions and returns composite score.
   *
   * @param face Raw face detection output from Human.js
   * @returns Quality assessment with scores and details
   */
  assessQuality(face: Record<string, unknown>): FaceQualityScore;

  /**
   * Check if quality score is acceptable for enrollment.
   * Runs multiple threshold checks on individual dimensions.
   *
   * @param score Quality score from assessQuality()
   * @param threshold Minimum overall score (default: 0.65)
   * @returns true if all checks pass, false otherwise
   */
  isQualityAcceptable(score: FaceQualityScore, threshold?: number): boolean;

  /**
   * Get human-readable feedback for poor quality faces.
   * Used in UI to guide user: "Light is too dim", "Turn slightly left", etc.
   *
   * @param score Quality score
   * @returns List of actionable feedback strings
   */
  getQualityFeedback(score: FaceQualityScore): string[];
}
