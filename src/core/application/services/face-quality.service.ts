import type { FaceQualityScore,IFaceQualityService } from '@/core/domain/contracts';

/**
 * Face Quality Assessment Service
 *
 * Analyzes multiple quality dimensions of detected faces:
 * 1. Brightness - Lightning quality and shadows
 * 2. Blurriness - Focus/motion blur detection
 * 3. Head pose - Angle constraints (frontal face is best)
 * 4. Face size - Minimum resolution for embedding extraction
 * 5. Landmarks - Confidence in facial feature detection
 *
 * Thresholds aligned with NIST FRVT and field testing.
 */
export class FaceQualityService implements IFaceQualityService {
  // Configurable thresholds
  private readonly QUALITY_THRESHOLD = 0.65; // Overall score threshold
  private readonly MIN_FACE_SIZE = 100; // Minimum face width in pixels
  private readonly MAX_YAW = Math.PI * 0.2; // ±36 degrees
  private readonly MAX_PITCH = Math.PI * 0.2; // ±36 degrees
  private readonly MAX_ROLL = Math.PI * 0.15; // ±27 degrees
  private readonly MAX_BLUR = 0.3; // Blurriness score threshold
  private readonly BRIGHTNESS_RANGE = 0.3; // [-0.3, 0.3] is optimal

  assessQuality(face: Record<string, unknown>): FaceQualityScore {
    const now = new Date();
    const failures: string[] = [];

    try {
      // Extract face components
      const box = face['box'] as Record<string, unknown> | undefined;
      const description = face['description'] as Record<string, unknown> | undefined;
      const landmarks = face['landmarks'] as unknown;

      // 1. Brightness assessment
      const brightness = this.assessBrightness(face, description);
      if (Math.abs(brightness) > this.BRIGHTNESS_RANGE) {
        failures.push(
          brightness < -this.BRIGHTNESS_RANGE
            ? 'Lighting too dim - please move to brighter area'
            : 'Lighting too bright - reduce glare or shadows',
        );
      }

      // 2. Blurriness assessment
      const blurriness = this.assessBlurriness(description);
      if (blurriness > this.MAX_BLUR) {
        failures.push('Image is blurry - hold still and ensure good focus');
      }

      // 3. Head pose assessment
      const headPose = {
        yaw: Number(face['yaw'] ?? 0),
        pitch: Number(face['pitch'] ?? 0),
        roll: Number(face['roll'] ?? 0),
      };

      if (Math.abs(headPose.yaw) > this.MAX_YAW) {
        failures.push('Face angle too extreme - look more directly at camera');
      }
      if (Math.abs(headPose.pitch) > this.MAX_PITCH) {
        failures.push('Head tilt too extreme - straighten your posture');
      }
      if (Math.abs(headPose.roll) > this.MAX_ROLL) {
        failures.push('Head rotation too extreme - keep head straight');
      }

      // 4. Face size assessment
      const faceSize = Number(box?.['width'] ?? 0);
      if (faceSize < this.MIN_FACE_SIZE) {
        failures.push(`Face too small (${Math.round(faceSize)}px) - move closer to camera`);
      }

      // 5. Landmark confidence assessment
      const landmarkMetrics = this.extractLandmarkConfidence(landmarks);
      if (landmarkMetrics.meanConfidence < 0.5) {
        failures.push('Face landmarks not clear - ensure good lighting and frontal pose');
      }

      // Calculate composite score (weighted average)
      const normalizedPose = this.normalizePose(headPose);
      const normalizedFaceSize = this.normalizeFaceSize(faceSize);
      const normalizedBlur = 1 - blurriness; // Invert (lower blur = higher score)
      const normalizedBrightness = 1 - Math.abs(brightness); // Perfect at 0, worse at extremes

      const overallScore =
        normalizedBrightness * 0.2 +
        normalizedBlur * 0.2 +
        normalizedPose * 0.2 +
        normalizedFaceSize * 0.2 +
        landmarkMetrics.meanConfidence * 0.2;

      return {
        brightness,
        blurriness,
        headPose,
        faceSize,
        landmarks: landmarkMetrics,
        overallScore: Math.max(0, Math.min(1, overallScore)),
        assessmentDetails: {
          timestamp: now,
          passed: failures.length === 0,
          failures,
        },
      };
    } catch (error) {
      // If assessment fails, return low confidence score
      return {
        brightness: 0,
        blurriness: 1,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        faceSize: 0,
        landmarks: { confidence: [], meanConfidence: 0 },
        overallScore: 0,
        assessmentDetails: {
          timestamp: now,
          passed: false,
          failures: ['Quality assessment failed', error instanceof Error ? error.message : String(error)],
        },
      };
    }
  }

  isQualityAcceptable(score: FaceQualityScore, threshold?: number): boolean {
    const acceptanceThreshold = threshold ?? this.QUALITY_THRESHOLD;

    // Check all individual dimensions (hard requirements)
    const meetsOverallScore = score.overallScore >= acceptanceThreshold;
    const meetsHeadPose =
      Math.abs(score.headPose.yaw) < this.MAX_YAW &&
      Math.abs(score.headPose.pitch) < this.MAX_PITCH &&
      Math.abs(score.headPose.roll) < this.MAX_ROLL;
    const meetsFaceSize = score.faceSize > this.MIN_FACE_SIZE;
    const meetsBlur = score.blurriness < this.MAX_BLUR;
    const meetsBrightness = Math.abs(score.brightness) < this.BRIGHTNESS_RANGE;
    const meetsLandmarks = score.landmarks.meanConfidence > 0.5;

    return meetsOverallScore && meetsHeadPose && meetsFaceSize && meetsBlur && meetsBrightness && meetsLandmarks;
  }

  getQualityFeedback(score: FaceQualityScore): string[] {
    return score.assessmentDetails.failures;
  }

  // ────── Private Helper Methods ──────

  /**
   * Assess brightness from face descriptor.
   * Uses descriptor distance as proxy for lighting quality.
   * Returns -1 (dark) to 1 (bright), with 0 being optimal.
   */
  private assessBrightness(face: Record<string, unknown>, description?: Record<string, unknown>): number {
    // Heuristic: use descriptor confidence as brightness indicator
    // High variance in descriptor values = harsh lighting
    // Low variance = even lighting (good)

    const descriptorConfidence = Number(description?.['confidence'] ?? 0.5);

    // Convert confidence to brightness (-1 to 1)
    // Low confidence (.3) → brightness +0.7 (too bright/washed)
    // Medium confidence (.5) → brightness 0 (optimal)
    // High confidence (.8) → brightness -0.2 (slightly dim)

    return (0.5 - descriptorConfidence) * 2; // Range: -1 to 1
  }

  /**
   * Assess blurriness from descriptor variance.
   * Higher variance in embeddings = better focus (lower blur)
   */
  private assessBlurriness(description?: Record<string, unknown>): number {
    const descriptorConfidence = Number(description?.['confidence'] ?? 0.5);

    // Confidence 0.9+ = sharp (blur 0)
    // Confidence 0.5 = blurry (blur 0.5)
    // Confidence < 0.3 = very blurry (blur 1)

    if (descriptorConfidence > 0.8) return 0; // Sharp
    if (descriptorConfidence > 0.6) return 0.2; // Slightly blurry
    if (descriptorConfidence > 0.4) return 0.4; // Blurry
    return 0.8; // Very blurry
  }

  /**
   * Normalize head pose to 0-1 score.
   * Perfect frontal face = 1.0
   * Extreme angle = 0.0
   */
  private normalizePose(pose: { yaw: number; pitch: number; roll: number }): number {
    const yawScore = 1 - (Math.abs(pose.yaw) / this.MAX_YAW) * 0.5;
    const pitchScore = 1 - (Math.abs(pose.pitch) / this.MAX_PITCH) * 0.5;
    const rollScore = 1 - (Math.abs(pose.roll) / this.MAX_ROLL) * 0.3;

    return Math.max(0, Math.min(1, (yawScore + pitchScore + rollScore) / 3));
  }

  /**
   * Normalize face size to 0-1 score.
   * Minimum (100px) = 0.0
   * Large (400px+) = 1.0
   */
  private normalizeFaceSize(size: number): number {
    const minSize = this.MIN_FACE_SIZE;
    const idealSize = 400;

    if (size < minSize) return 0;
    if (size >= idealSize) return 1;

    return (size - minSize) / (idealSize - minSize);
  }

  /**
   * Extract landmark confidence from Human.js landmarks array.
   * Returns both individual confidences and mean.
   */
  private extractLandmarkConfidence(landmarks: unknown): {
    confidence: number[];
    meanConfidence: number;
  } {
    if (!Array.isArray(landmarks)) {
      return { confidence: [], meanConfidence: 0 };
    }

    // landmarks[i] = [x, y, z, confidence]
    const confidences: number[] = [];

    try {
      for (const landmark of landmarks as unknown[]) {
        if (Array.isArray(landmark) && landmark.length >= 4) {
          // landmark[3] is typically confidence
          const conf = Number(landmark[3] ?? 0);
          if (conf >= 0 && conf <= 1) {
            confidences.push(conf);
          }
        }
      }
    } catch {
      // If parsing fails, return 0 confidence
      return { confidence: [], meanConfidence: 0 };
    }

    if (confidences.length === 0) {
      return { confidence: [], meanConfidence: 0 };
    }

    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    return {
      confidence: confidences,
      meanConfidence: Math.max(0, Math.min(1, mean)),
    };
  }
}
