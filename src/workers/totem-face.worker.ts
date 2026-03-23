/// <reference lib="webworker" />

import { Human } from '@vladmandic/human';
import {
  assignFacesToTracks,
  clearTracks,
  createFaceTracker,
  createNewTrack,
  getAggregatedLivenessScore,
  getTrackStability,
  type FaceDetection,
  type FaceTracker,
  type TrackedFace,
  updateTrackLiveness,
} from '@/core/infrastructure/features/face-tracking';

type WorkerInitPayload = {
  maxFaces: number;
  minFaceSize: number;
  livenessEnabled: boolean;
  trackingEnabled?: boolean; // NEW (Phase 4)
  detectorType?: 'human' | 'scrfd'; // NEW (Phase 4)
  fallbackEnabled?: boolean; // NEW (Phase 4)
};

type WorkerAnalyzePayload = {
  bitmap: ImageBitmap;
};

type WorkerRequest =
  | { id: number; type: 'init'; payload: WorkerInitPayload }
  | { id: number; type: 'analyze'; payload: WorkerAnalyzePayload }
  | { id: number; type: 'dispose' };

type WorkerResponse = {
  id: number;
  ok: boolean;
  error?: string;
  data?: unknown;
};

// ── NEW: Face Quality Score ─────────────────────────────────────
interface FaceQualityMetadata {
  brightness: number;
  blurriness: number;
  faceSize: number;
  headPoseYaw: number;
  headPosePitch: number;
  headPoseRoll: number;
  landmarkConfidence: number;
}

// ── NEW: Multimodal Liveness Analysis ───────────────────────────
interface LivenessAnalysis {
  antiSpoofScore: number;
  blinkDetected: boolean;
  headMovementDetected: boolean;
  textureQuality: number;
  finalLivenessScore: number;
  timestamp?: number; // NEW (Phase 4)
}

let human: Human | null = null;
let initialized = false;

// ── NEW (Phase 4): Face Tracking State ──────────────────────────────────
let faceTracker: FaceTracker | null = null;
let trackingEnabled = false;

// ── Blink & Head Movement Detection ──────────────────────────────────
// Track face landmarks to detect actual eye blinks and head movements

interface FrameState {
  eyeState: { leftOpen: boolean; rightOpen: boolean };
  headRotation: { yaw: number; pitch: number; roll: number };
  timestamp: number;
}

const FRAME_HISTORY_SIZE = 20; // Track last 20 frames (~667ms at 30fps)
const BLINK_THRESHOLD_FRAMES = 3; // Minimum frames to confirm blink
let frameHistory: FrameState[] = [];
const _detectedBlinksCount = 0;

/**
 * Detect blink from iris/eye state
 * Eyes are considered "open" when iris is visible within eye bounds
 */
function detectEyeBlink(face: Record<string, unknown>): { leftOpen: boolean; rightOpen: boolean } {
  // Try to extract iris data
  const iris = face['iris'] as unknown;
  if (!iris) {
    return { leftOpen: true, rightOpen: true }; // Default open if no iris data
  }

  const irisArray = Array.isArray(iris) ? iris : [];

  // iris typically has [left_iris, right_iris] or similar structure
  // If iris confidence is 0 or null, eye is likely closed
  let leftOpen = true;
  let rightOpen = true;

  if (Array.isArray(irisArray[0])) {
    const leftIris = irisArray[0] as number[];
    leftOpen = leftIris && leftIris.length > 0 && (leftIris[3] ?? 0.1) > 0.05; // confidence > 0.05
  }

  if (Array.isArray(irisArray[1])) {
    const rightIris = irisArray[1] as number[];
    rightOpen = rightIris && rightIris.length > 0 && (rightIris[3] ?? 0.1) > 0.05;
  }

  return { leftOpen, rightOpen };
}

/**
 * Detect actual blinks by looking for eye closure transitions
 * A blink is: open -> closed -> open sequence detected
 * Returns true if at least one blink was detected in recent frames
 */
function processBlinks(): boolean {
  if (frameHistory.length < BLINK_THRESHOLD_FRAMES) return false;

  const recent = frameHistory.slice(-10); // Look at last 10 frames

  // Detect blink pattern: open → closed → open
  for (let i = 1; i < recent.length - 1; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    const next = recent[i + 1];

    const wasBothOpen = prev.eyeState.leftOpen && prev.eyeState.rightOpen;
    const isEitherClosed = !curr.eyeState.leftOpen || !curr.eyeState.rightOpen;
    const isOpenAgain = next.eyeState.leftOpen && next.eyeState.rightOpen;

    if (wasBothOpen && isEitherClosed && isOpenAgain) {
      // _detectedBlinksCount++;
      return true;
    }

    // Also detect partial blink (one eye closes fully)
    const wasLeftOpen = prev.eyeState.leftOpen;
    const isLeftClosed = !curr.eyeState.leftOpen;
    const leftOpenAgain = next.eyeState.leftOpen;

    if (wasLeftOpen && isLeftClosed && leftOpenAgain) {
      // _detectedBlinksCount++;
      return true;
    }

    // Same for right eye
    const wasRightOpen = prev.eyeState.rightOpen;
    const isRightClosed = !curr.eyeState.rightOpen;
    const rightOpenAgain = next.eyeState.rightOpen;

    if (wasRightOpen && isRightClosed && rightOpenAgain) {
      // _detectedBlinksCount++;
      return true;
    }
  }

  return false;
}

/**
 * Detect head movements (yaw/rotation for liveness challenge response)
 * Challenge: "Turn your head left and right" or "Nod your head"
 */
function _detectHeadMovement(): { hasMovement: boolean; direction: string; magnitude: number } {
  if (frameHistory.length < 5) {
    return { hasMovement: false, direction: 'insufficient_data', magnitude: 0 };
  }

  const first = frameHistory[0];
  const last = frameHistory[frameHistory.length - 1];

  // Angles are typically in radians, convert to degrees
  const yawChange = Math.abs((last.headRotation.yaw - first.headRotation.yaw) * 180 / Math.PI);
  const pitchChange = Math.abs((last.headRotation.pitch - first.headRotation.pitch) * 180 / Math.PI);
  const rollChange = Math.abs((last.headRotation.roll - first.headRotation.roll) * 180 / Math.PI);

  const totalMovement = yawChange + pitchChange + rollChange;

  if (totalMovement > 25) {
    // Significant movement detected
    if (yawChange > pitchChange && yawChange > 10) {
      return { hasMovement: true, direction: 'horizontal', magnitude: yawChange }; // Left-right turn
    } else if (pitchChange > 10) {
      return { hasMovement: true, direction: 'vertical', magnitude: pitchChange }; // Nod up-down
    } else if (rollChange > 10) {
      return { hasMovement: true, direction: 'rotational', magnitude: rollChange }; // Tilt
    }
  }

  return { hasMovement: false, direction: 'none', magnitude: 0 };
}

function detectBlink(face: Record<string, unknown>): boolean {
  const now = Date.now();

  // Extract eye state from iris tracking
  const eyeState = detectEyeBlink(face);

  // Extract head rotation from face landmarks if available
  const headRotation = {
    yaw: Number(face['yaw'] ?? 0),
    pitch: Number(face['pitch'] ?? 0),
    roll: Number(face['roll'] ?? 0),
  };

  frameHistory.push({ eyeState, headRotation, timestamp: now });

  // Keep only recent frames (roughly last 1 second)
  frameHistory = frameHistory.filter((f) => now - f.timestamp < 1000);

  // Keep only last N frames
  if (frameHistory.length > FRAME_HISTORY_SIZE) {
    frameHistory = frameHistory.slice(-FRAME_HISTORY_SIZE);
  }

  // Use actual blink detection
  return processBlinks();
}

// ── NEW (Phase 1): Multimodal Liveness Detection ─────────────────
function computeMultimodalLiveness(
  face: Record<string, unknown>,
  frameHistory: FrameState[],
  livenessEnabled: boolean,
): LivenessAnalysis {
  if (!livenessEnabled) {
    return {
      antiSpoofScore: 1,
      blinkDetected: true,
      headMovementDetected: true,
      textureQuality: 1,
      finalLivenessScore: 1,
      timestamp: Date.now(),
    };
  }

  // 1. Anti-spoofing score (from Human.js model)
  const antiSpoofScore = extractAntiSpoofScore(face);

  // 2. Blink detection (from temporal eye state)
  const blinkDetected = processBlinks();

  // 3. Head movement detection (from frame history)
  const headMovement = _detectHeadMovement();
  const headMovementDetected = headMovement.magnitude > 15; // degrees threshold

  // 4. Texture quality (face descriptor confidence)
  const description = face['description'] as Record<string, unknown> | undefined;
  const textureQuality = Number(description?.['confidence'] ?? 0.5);

  // Weighted combination (normalized 0-1)
  const finalScore =
    antiSpoofScore * 0.4 +
    (blinkDetected ? 0.8 : 0.2) * 0.3 +
    (headMovementDetected ? 0.8 : 0.2) * 0.2 +
    textureQuality * 0.1;

  return {
    antiSpoofScore,
    blinkDetected,
    headMovementDetected,
    textureQuality,
    finalLivenessScore: Math.max(0, Math.min(1, finalScore)),
    timestamp: Date.now(),
  };
}

/**
 * Extract anti-spoof score from Human.js model.
 * Returns 0-1 confidence value.
 */
function extractAntiSpoofScore(face: Record<string, unknown>): number {
  // Try multiple possible field names from Human.js output
  const possibleFields = ['antiSpoof', 'liveness', 'live', 'real', 'spoofScore'];

  for (const field of possibleFields) {
    const value = face[field];

    // Check if it's a nested object with score
    if (typeof value === 'object' && value !== null) {
      const score = (value as Record<string, unknown>)['score'];
      if (typeof score === 'number') {
        return Math.max(0, Math.min(1, score));
      }
    }

    // Check if it's a direct number
    if (typeof value === 'number') {
      return Math.max(0, Math.min(1, value));
    }

    // Check if it's boolean
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
  }

  // Fallback: if no anti-spoof data, assume not live
  return 0;
}

// ── NEW (Phase 1): Face Quality Assessment ──────────────────────
function assessFaceQuality(face: Record<string, unknown>): FaceQualityMetadata {
  const box = (face['box'] ?? {}) as Record<string, unknown>;
  const description = face['description'] as Record<string, unknown> | undefined;

  // Brightness: based on descriptor confidence variance
  const descriptorConfidence = Number(description?.['confidence'] ?? 0.5);
  const brightness = (0.5 - descriptorConfidence) * 2; // Range: -1 to 1

  // Blurriness: inverse of descriptor confidence
  let blurriness = 0.5;
  if (descriptorConfidence > 0.8) blurriness = 0;
  else if (descriptorConfidence > 0.6) blurriness = 0.2;
  else if (descriptorConfidence > 0.4) blurriness = 0.4;
  else blurriness = 0.8;

  // Face size
  const faceSize = Number(box['width'] ?? 0);

  // Head pose angles
  const headPoseYaw = Number(face['yaw'] ?? 0);
  const headPosePitch = Number(face['pitch'] ?? 0);
  const headPoseRoll = Number(face['roll'] ?? 0);

  // Landmark confidence (from mesh or landmarks array)
  const landmarks = face['landmarks'] as unknown[];
  let landmarkConfidence = 0.5;

  if (Array.isArray(landmarks) && landmarks.length > 0) {
    const confidences: number[] = [];
    for (const lm of landmarks) {
      if (Array.isArray(lm) && lm.length >= 4) {
        const conf = Number(lm[3] ?? 0);
        if (conf >= 0 && conf <= 1) confidences.push(conf);
      }
    }

    if (confidences.length > 0) {
      landmarkConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
  }

  return {
    brightness,
    blurriness,
    faceSize,
    headPoseYaw,
    headPosePitch,
    headPoseRoll,
    landmarkConfidence,
  };
}

function buildHumanConfig(payload: WorkerInitPayload) {
  return {
    debug: false,
    backend: 'webgl',
    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
    cacheSensitivity: 0,
    face: {
      enabled: true,
      detector: {
        enabled: true,
        maxDetected: payload.maxFaces,
        minConfidence: 0.6,
        rotation: true,
      },
      mesh: {
        enabled: false,
      },
      iris: {
        enabled: true, // Enable iris tracking for accurate blink detection
      },
      emotion: {
        enabled: false,
      },
      description: {
        enabled: true,
      },
      antiSpoof: {
        enabled: payload.livenessEnabled,
      },
      liveness: {
        enabled: payload.livenessEnabled,
      },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false },
  } as const;
}

async function initHuman(payload: WorkerInitPayload) {
  if (!human) {
    human = new Human(buildHumanConfig(payload));
  }

  await human.load();
  await human.warmup();
  initialized = true;

  // NEW (Phase 4): Initialize face tracking if enabled
  trackingEnabled = payload.trackingEnabled ?? false;
  if (trackingEnabled) {
    faceTracker = createFaceTracker(60); // 60 frames ~= 2 seconds at 30fps
  } else {
    faceTracker = null;
  }
}

function normalizeLivenessScore(face: Record<string, unknown>, enabled: boolean): number {
  if (!enabled) return 1; // Max score if liveness not required

  // Try to extract liveness/antiSpoof from multiple possible sources
  // Human.js may return: face.live, face.real, face.liveness, face.antiSpoof, or face.score

  let livenessValue: unknown = undefined;

  // Try multiple field names in order of preference
  const fieldNames = ['liveness', 'live', 'real', 'antiSpoof', 'score'];
  for (const field of fieldNames) {
    const value = face[field];
    if (value !== undefined && value !== null) {
      livenessValue = value;
      break;
    }
  }

  // If still no value, try nested structures
  if (livenessValue === undefined) {
    const antiSpoof = face['antiSpoof'] as Record<string, unknown> | undefined;
    if (antiSpoof && typeof antiSpoof === 'object') {
      livenessValue = antiSpoof['score'] ?? antiSpoof['value'];
    }
  }

  // Normalize to 0-1 range
  if (typeof livenessValue === 'number') {
    return Math.max(0, Math.min(1, livenessValue));
  }

  if (typeof livenessValue === 'boolean') {
    return livenessValue ? 1 : 0;
  }

  // If we detected a blink, increase liveness confidence
  const eyeState = detectEyeBlink(face);
  if (eyeState.leftOpen || eyeState.rightOpen) {
    return 0.7; // Reasonable confidence if we detected eye state
  }

  // Fallback: assume not live
  return 0;
}

async function analyzeFrame(payload: WorkerAnalyzePayload, initPayload: WorkerInitPayload) {
  if (!human || !initialized) {
    await initHuman(initPayload);
  }

  const result = await human!.detect(payload.bitmap);
  payload.bitmap.close();

  const faces = (result.face ?? []) as unknown as Array<Record<string, unknown>>;

  if (!faces.length) {
    return {
      faceCount: 0,
      face: null,
      blinkDetected: false,
      liveness: {
        antiSpoofScore: 0,
        blinkDetected: false,
        headMovementDetected: false,
        textureQuality: 0,
        finalLivenessScore: 0,
      },
    };
  }

  const bestFace = faces[0];
  const box = (bestFace['box'] ?? {}) as Record<string, unknown>;
  const embeddingRaw = bestFace['embedding'];

  const embedding = Array.isArray(embeddingRaw)
    ? embeddingRaw.map((value) => Number(value))
    : embeddingRaw instanceof Float32Array
      ? Array.from(embeddingRaw)
      : [];

  const width = Number(box['width'] ?? 0);
  const height = Number(box['height'] ?? 0);

  // Detect actual blink
  const blinkDetected = detectBlink(bestFace);

  // NEW (Phase 1): Compute multimodal liveness
  const liveness = computeMultimodalLiveness(bestFace, frameHistory, initPayload.livenessEnabled);

  // NEW (Phase 1): Assess face quality
  const qualityMetadata = assessFaceQuality(bestFace);

  // NEW (Phase 4): Face tracking
  let trackId: string | undefined;
  let trackStability: number | undefined;
  let historicalLivenessAvg: number | undefined;

  if (trackingEnabled && faceTracker) {
    // Convert detection to tracking format
    const detection: FaceDetection = {
      box: {
        x: Number(box['x'] ?? 0),
        y: Number(box['y'] ?? 0),
        width,
        height,
      },
      landmarks: bestFace['landmarks'],
      embedding,
      confidence: Number(bestFace['confidence'] ?? 0.5),
    };

    // Assign to existing tracks or create new one
    const { tracked, newDetections: newDetections } = assignFacesToTracks([detection], faceTracker);

    let bestTrack: TrackedFace;

    if (tracked.length > 0) {
      // Use existing track
      bestTrack = tracked[0].track;
    } else if (newDetections.length > 0) {
      // Create new track for this detection
      bestTrack = createNewTrack(detection, faceTracker);
    } else {
      // No track available (shouldn't happen)
      bestTrack = createNewTrack(detection, faceTracker);
    }

    // Update track's liveness history
    const livenessScore = {
      ...liveness,
      timestamp: liveness.timestamp || Date.now(),
    };
    updateTrackLiveness(bestTrack, livenessScore);

    // Calculate aggregated liveness from last 5 frames
    historicalLivenessAvg = getAggregatedLivenessScore(bestTrack, 5);

    // Get track stability metrics
    const stability = getTrackStability(bestTrack);
    trackStability = stability.iouConfidence;
    trackId = bestTrack.id;
  }

  // Build final response
  const faceResponse = {
    box: {
      x: Number(box['x'] ?? 0),
      y: Number(box['y'] ?? 0),
      width,
      height,
    },
    isBigEnough: width >= initPayload.minFaceSize && height >= initPayload.minFaceSize,
    embedding,
    livenessScore: liveness.finalLivenessScore,
    qualityScore: computeQualityScore(qualityMetadata),
    qualityMetadata,
  };

  // Add tracking fields if tracking is enabled
  if (trackingEnabled && trackId !== undefined && trackStability !== undefined && historicalLivenessAvg !== undefined) {
    Object.assign(faceResponse, {
      trackId,
      trackStability,
      historicalLivenessAvg,
    });
  }

  return {
    faceCount: faces.length,
    face: faceResponse,
    blinkDetected,
    liveness,
  };
}

// Helper to compute overall quality score
function computeQualityScore(quality: FaceQualityMetadata): number {
  const normalizedBrightness = 1 - Math.abs(quality.brightness);
  const normalizedBlur = 1 - quality.blurriness;
  const normalizedPose = Math.max(
    0,
    1 - (Math.abs(quality.headPoseYaw) + Math.abs(quality.headPosePitch) + Math.abs(quality.headPoseRoll)) / 3,
  );
  const normalizedFaceSize = Math.min(1, quality.faceSize / 400);

  return (
    normalizedBrightness * 0.2 +
    normalizedBlur * 0.2 +
    normalizedPose * 0.2 +
    normalizedFaceSize * 0.2 +
    quality.landmarkConfidence * 0.2
  );
}

let lastInitPayload: WorkerInitPayload = {
  maxFaces: 1,
  minFaceSize: 80,
  livenessEnabled: false,
};

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === 'init') {
      lastInitPayload = request.payload;
      await initHuman(request.payload);

      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        data: { ready: true },
      };

      ctx.postMessage(response);
      return;
    }

    if (request.type === 'analyze') {
      const data = await analyzeFrame(request.payload, lastInitPayload);

      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        data,
      };

      ctx.postMessage(response);
      return;
    }

    if (request.type === 'dispose') {
      await human?.reset();
      human = null;
      initialized = false;

      // NEW (Phase 4): Clear face tracker
      if (faceTracker) {
        clearTracks(faceTracker);
        faceTracker = null;
      }

      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        data: { disposed: true },
      };

      ctx.postMessage(response);
      return;
    }
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : 'Worker runtime error.',
    };

    ctx.postMessage(response);
  }
};

export {};
