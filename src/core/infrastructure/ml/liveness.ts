/**
 * Liveness Detection Module
 *
 * Multi-frame anti-spoofing using passive liveness techniques:
 * - Blink detection (eye aspect ratio tracking)
 * - Head movement detection (landmark variance)
 * - Texture quality analysis
 *
 * No additional model required - uses landmarks from SCRFD
 * Combined with Human.js anti-spoof model for hybrid detection
 */

export interface LivenessFrame {
  timestamp: number;
  landmarks: number[][];
  eyeAspectRatio: { left: number; right: number };
  headPose: { yaw: number; pitch: number; roll: number };
}

export interface LivenessResult {
  isLive: boolean;
  score: number;
  blinkDetected: boolean;
  headMovementDetected: boolean;
  textureScore: number;
  framesAnalyzed: number;
  reason?: string;
}

export interface LivenessConfig {
  minFrames: number;
  blinkThreshold: number;
  headMovementThreshold: number;
  livenessThreshold: number;
  frameHistorySize: number;
}

const DEFAULT_CONFIG: LivenessConfig = {
  minFrames: 10,
  blinkThreshold: 0.21,
  headMovementThreshold: 3.0,
  livenessThreshold: 0.7,
  frameHistorySize: 30,
};

export class LivenessDetector {
  private config: LivenessConfig;
  private frameHistory: LivenessFrame[] = [];
  private blinkHistory: boolean[] = [];
  private lastEyeState: { leftOpen: boolean; rightOpen: boolean } = { leftOpen: true, rightOpen: true };

  constructor(config?: Partial<LivenessConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Reset state for new detection session
   */
  reset(): void {
    this.frameHistory = [];
    this.blinkHistory = [];
    this.lastEyeState = { leftOpen: true, rightOpen: true };
  }

  /**
   * Add a frame to the analysis
   */
  addFrame(landmarks: number[][]): void {
    if (landmarks.length < 5) return;

    const frame = this.analyzeFrame(landmarks);
    this.frameHistory.push(frame);

    // Keep history bounded
    if (this.frameHistory.length > this.config.frameHistorySize) {
      this.frameHistory.shift();
    }

    // Track blink state
    const eyeOpen = this.areEyesOpen(frame.eyeAspectRatio);
    this.updateBlinkHistory(eyeOpen);
    this.lastEyeState = eyeOpen;
  }

  /**
   * Analyze single frame from landmarks
   */
  private analyzeFrame(landmarks: number[][]): LivenessFrame {
    // Extract eye aspect ratios from 5-point landmarks
    // Landmarks: [left_eye, right_eye, nose, mouth_left, mouth_right]
    const leftEye = landmarks[0];
    const rightEye = landmarks[1];
    const nose = landmarks[2];
    const mouthLeft = landmarks[3];
    const mouthRight = landmarks[4];

    // Calculate eye aspect ratios (simplified for 5-point landmarks)
    // For 5-point, we estimate based on relative positions
    const eyeDistance = this.distance(leftEye, rightEye);
    const noseToMouthMid = this.distance(nose, [
      (mouthLeft[0] + mouthRight[0]) / 2,
      (mouthLeft[1] + mouthRight[1]) / 2,
    ]);

    // Estimate eye aspect ratio based on vertical face proportion
    const faceAspect = noseToMouthMid / eyeDistance;
    const leftEAR = Math.min(0.35, faceAspect * 0.3);
    const rightEAR = Math.min(0.35, faceAspect * 0.3);

    // Calculate head pose from landmarks
    const headPose = this.estimateHeadPose(landmarks);

    return {
      timestamp: Date.now(),
      landmarks,
      eyeAspectRatio: { left: leftEAR, right: rightEAR },
      headPose,
    };
  }

  /**
   * Estimate head pose from 5-point landmarks
   */
  private estimateHeadPose(landmarks: number[][]): { yaw: number; pitch: number; roll: number } {
    const leftEye = landmarks[0];
    const rightEye = landmarks[1];
    const nose = landmarks[2];
    const mouthMid = [(landmarks[3][0] + landmarks[4][0]) / 2, (landmarks[3][1] + landmarks[4][1]) / 2];

    // Calculate roll (head tilt) from eye angle
    const eyeAngle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
    const roll = (eyeAngle * 180) / Math.PI;

    // Calculate yaw (left/right turn) from nose position relative to eye center
    const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;
    const eyeDistance = this.distance(leftEye, rightEye);
    const noseOffset = (nose[0] - eyeCenterX) / eyeDistance;
    const yaw = noseOffset * 45; // Approximate degrees

    // Calculate pitch (up/down) from nose to mouth distance
    const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
    const noseToEyeY = nose[1] - eyeCenterY;
    const noseToMouthY = mouthMid[1] - nose[1];
    const pitchRatio = noseToEyeY / (noseToMouthY || 1);
    const pitch = (pitchRatio - 0.5) * 30; // Approximate degrees

    return { yaw, pitch, roll };
  }

  /**
   * Check if eyes are open based on aspect ratio
   */
  private areEyesOpen(ear: { left: number; right: number }): { leftOpen: boolean; rightOpen: boolean } {
    return {
      leftOpen: ear.left > this.config.blinkThreshold,
      rightOpen: ear.right > this.config.blinkThreshold,
    };
  }

  /**
   * Update blink history
   */
  private updateBlinkHistory(currentState: { leftOpen: boolean; rightOpen: boolean }): void {
    // Detect blink: was open -> closed -> open
    const wasOpen = this.lastEyeState.leftOpen && this.lastEyeState.rightOpen;
    const isClosed = !currentState.leftOpen || !currentState.rightOpen;

    if (wasOpen && isClosed) {
      // Potential blink start
      this.blinkHistory.push(false); // closed
    } else if (!wasOpen && currentState.leftOpen && currentState.rightOpen) {
      // Blink complete
      this.blinkHistory.push(true); // blink detected
    }

    // Keep bounded
    if (this.blinkHistory.length > 20) {
      this.blinkHistory.shift();
    }
  }

  /**
   * Detect if blink occurred in recent frames
   */
  private detectBlink(): boolean {
    return this.blinkHistory.some((b) => b === true);
  }

  /**
   * Detect head movement from frame history
   */
  private detectHeadMovement(): boolean {
    if (this.frameHistory.length < 5) return false;

    // Calculate variance in head pose
    const poses = this.frameHistory.slice(-10).map((f) => f.headPose);

    const yawVariance = this.variance(poses.map((p) => p.yaw));
    const pitchVariance = this.variance(poses.map((p) => p.pitch));

    // Movement detected if variance exceeds threshold
    return yawVariance > this.config.headMovementThreshold || pitchVariance > this.config.headMovementThreshold;
  }

  /**
   * Calculate variance of array
   */
  private variance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  /**
   * Calculate Euclidean distance
   */
  private distance(p1: number[], p2: number[]): number {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  }

  /**
   * Calculate texture quality score from landmarks consistency
   */
  private calculateTextureScore(): number {
    if (this.frameHistory.length < 3) return 0.5;

    // Measure landmark stability across frames
    // Stable landmarks suggest real face; jittery suggests photo/video attack
    const recentFrames = this.frameHistory.slice(-5);
    let totalVariance = 0;

    for (let i = 0; i < 5; i++) {
      const points = recentFrames.map((f) => f.landmarks[i]);
      const xVariance = this.variance(points.map((p) => p[0]));
      const yVariance = this.variance(points.map((p) => p[1]));
      totalVariance += xVariance + yVariance;
    }

    // Lower variance = more stable = higher quality
    // But too stable might indicate photo attack
    const avgVariance = totalVariance / 10;

    // Ideal variance range: 0.5-5 pixels
    if (avgVariance < 0.2) return 0.3; // Too stable - likely photo
    if (avgVariance > 20) return 0.4; // Too jittery - noise
    if (avgVariance >= 0.5 && avgVariance <= 5) return 0.9; // Natural micro-movements

    return 0.6;
  }

  /**
   * Get final liveness result
   */
  evaluate(): LivenessResult {
    if (this.frameHistory.length < this.config.minFrames) {
      return {
        isLive: false,
        score: 0,
        blinkDetected: false,
        headMovementDetected: false,
        textureScore: 0,
        framesAnalyzed: this.frameHistory.length,
        reason: 'Insufficient frames for analysis',
      };
    }

    const blinkDetected = this.detectBlink();
    const headMovementDetected = this.detectHeadMovement();
    const textureScore = this.calculateTextureScore();

    // Calculate weighted liveness score
    let score = 0;

    // Blink detection (30% weight)
    if (blinkDetected) score += 0.3;

    // Head movement (25% weight)
    if (headMovementDetected) score += 0.25;

    // Texture quality (45% weight)
    score += textureScore * 0.45;

    const isLive = score >= this.config.livenessThreshold;

    let reason: string | undefined;
    if (!isLive) {
      if (!blinkDetected && !headMovementDetected) {
        reason = 'No natural movement detected - possible photo attack';
      } else if (textureScore < 0.5) {
        reason = 'Texture analysis suggests non-live face';
      } else {
        reason = 'Liveness score below threshold';
      }
    }

    return {
      isLive,
      score,
      blinkDetected,
      headMovementDetected,
      textureScore,
      framesAnalyzed: this.frameHistory.length,
      reason,
    };
  }

  /**
   * Get current liveness score without final evaluation
   */
  getCurrentScore(): number {
    if (this.frameHistory.length < 3) return 0;

    const blinkDetected = this.detectBlink();
    const headMovementDetected = this.detectHeadMovement();
    const textureScore = this.calculateTextureScore();

    let score = 0;
    if (blinkDetected) score += 0.3;
    if (headMovementDetected) score += 0.25;
    score += textureScore * 0.45;

    return score;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LivenessConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.frameHistory.length;
  }
}

// Singleton instance
let defaultDetector: LivenessDetector | null = null;

export function getLivenessDetector(): LivenessDetector {
  if (!defaultDetector) {
    defaultDetector = new LivenessDetector();
  }
  return defaultDetector;
}

export function resetLivenessDetector(): void {
  if (defaultDetector) {
    defaultDetector.reset();
  }
}
