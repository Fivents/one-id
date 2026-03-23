/**
 * Face Tracking System
 *
 * Implements IoU-based face tracking across frames to:
 * - Assign detections to persistent face tracks
 * - Aggregate temporal liveness evidence
 * - Reduce false positives via track stability
 * - Enable anti-spoofing via face motion analysis
 *
 * Algorithm: Greedy nearest matching with IoU threshold
 * Performance: O(n × m) where n=detections, m=active_tracks
 * Typical: <5ms overhead on modern hardware
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LivenessScore {
  antiSpoofScore: number;
  blinkDetected: boolean;
  headMovementDetected: boolean;
  textureQuality: number;
  finalLivenessScore: number;
  timestamp: number;
}

export interface TrackedFace {
  id: string; // Persistent UUID across frames
  box: BoundingBox;
  landmarks: unknown; // Reuse existing landmarks structure
  embedding: number[];
  confidence: number;
  trackingConfidence: number; // IoU-based confidence (0-1)
  lastSeen: number; // Timestamp of last update
  framesSeen: number; // Number of frames this track has been active
  livenessHistory: LivenessScore[]; // Last 30 frames of liveness data
}

export interface FaceDetection {
  box: BoundingBox;
  landmarks: unknown;
  embedding: number[];
  confidence: number;
}

export interface FaceTracker {
  tracks: Map<string, TrackedFace>;
  nextTrackId: number;
  maxTrackAge: number; // Maximum frames to keep inactive track
  iouThreshold: number; // Minimum IoU to assign detection to track
  maxTrackHistorySize: number;
}

/**
 * Initialize a new face tracker
 * @param maxTrackAge - Max frames before removing idle tracks (60 frames ~= 2 seconds at 30fps)
 * @returns New FaceTracker instance
 */
export function createFaceTracker(maxTrackAge = 60): FaceTracker {
  return {
    tracks: new Map(),
    nextTrackId: 1,
    maxTrackAge,
    iouThreshold: 0.4, // Standard threshold for object tracking
    maxTrackHistorySize: 30, // Keep last 30 frames of liveness history
  };
}

/**
 * Calculate Intersection over Union (IoU) between two bounding boxes
 *
 * IoU = intersection_area / union_area
 * Range: [0, 1] where 1 = perfect overlap, 0 = no overlap
 *
 * Used to measure how well a detection matches an existing track
 */
function calculateIoU(box1: BoundingBox, box2: BoundingBox): number {
  const intersection = calculateIntersectionArea(box1, box2);
  const union = box1.width * box1.height + box2.width * box2.height - intersection;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

/**
 * Calculate intersection area between two bounding boxes
 * Returns 0 if boxes don't overlap
 */
function calculateIntersectionArea(box1: BoundingBox, box2: BoundingBox): number {
  const x_left = Math.max(box1.x, box2.x);
  const y_top = Math.max(box1.y, box2.y);
  const x_right = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y_bottom = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x_right < x_left || y_bottom < y_top) {
    return 0;
  }

  return (x_right - x_left) * (y_bottom - y_top);
}

/**
 * Assign detections to existing tracks using greedy nearest matching
 *
 * Algorithm:
 * 1. For each detection, find the unassigned track with highest IoU
 * 2. If IoU >= threshold, assign detection to track and update track state
 * 3. Unassigned detections become new tracks
 * 4. Clean up stale tracks (inactive for maxTrackAge frames)
 *
 * Complexity: O(n × m) where n=detections, m=active_tracks
 * Typical: n=1-3, m=1-5 on totems, so <5ms overhead
 */
export function assignFacesToTracks(
  detections: FaceDetection[],
  tracker: FaceTracker,
): {
  tracked: Array<{ track: TrackedFace; detection: FaceDetection }>;
  newDetections: FaceDetection[];
  staleTracks: string[];
} {
  const assignments: Map<FaceDetection, TrackedFace> = new Map();
  const unassignedTracks = new Set(tracker.tracks.values());
  const now = Date.now();

  // Greedy nearest matching: assign each detection to best matching track
  for (const detection of detections) {
    let bestTrack: TrackedFace | null = null;
    let bestIoU = tracker.iouThreshold;

    // Find best matching track for this detection
    for (const track of unassignedTracks) {
      const iou = calculateIoU(detection.box, track.box);

      if (iou > bestIoU) {
        bestIoU = iou;
        bestTrack = track;
      }
    }

    if (bestTrack) {
      // Assign detection to track
      assignments.set(detection, bestTrack);
      unassignedTracks.delete(bestTrack);

      // Update track with new detection data
      bestTrack.box = detection.box;
      bestTrack.landmarks = detection.landmarks;
      bestTrack.embedding = detection.embedding;
      bestTrack.confidence = detection.confidence;
      bestTrack.lastSeen = now;
      bestTrack.framesSeen++;
      bestTrack.trackingConfidence = bestIoU; // Store IoU as tracking confidence
    }
  }

  // Create new tracks for unassigned detections
  const newTracks: FaceDetection[] = [];
  for (const detection of detections) {
    if (!assignments.has(detection)) {
      newTracks.push(detection);
    }
  }

  // Clean up stale tracks (inactive for maxTrackAge frames)
  const staleTracks: string[] = [];
  for (const [trackId, track] of tracker.tracks) {
    const timeSinceLastSeen = now - track.lastSeen;
    const framesSinceLastSeen = timeSinceLastSeen / (1000 / 30); // Assume 30fps

    if (framesSinceLastSeen > tracker.maxTrackAge) {
      tracker.tracks.delete(trackId);
      staleTracks.push(trackId);
    }
  }

  return {
    tracked: Array.from(assignments.entries()).map(([detection, track]) => ({
      track,
      detection,
    })),
    newDetections: newTracks,
    staleTracks,
  };
}

/**
 * Add a new track for an unassigned detection
 * Used after assignFacesToTracks() to create tracks for new faces
 */
export function createNewTrack(detection: FaceDetection, tracker: FaceTracker): TrackedFace {
  const now = Date.now();
  const trackId = `track_${tracker.nextTrackId++}_${Date.now()}`;

  const track: TrackedFace = {
    id: trackId,
    box: detection.box,
    landmarks: detection.landmarks,
    embedding: detection.embedding,
    confidence: detection.confidence,
    trackingConfidence: 1.0, // New tracks have perfect confidence
    lastSeen: now,
    framesSeen: 1,
    livenessHistory: [],
  };

  tracker.tracks.set(trackId, track);
  return track;
}

/**
 * Update track's liveness history
 * Keeps only the last maxTrackHistorySize frames
 */
export function updateTrackLiveness(track: TrackedFace, liveness: LivenessScore): void {
  track.livenessHistory.push(liveness);

  // Keep only last N frames
  if (track.livenessHistory.length > 30) {
    track.livenessHistory.shift();
  }
}

/**
 * Calculate aggregated liveness score from track history
 * Uses last N frames to provide robust, temporal liveness validation
 */
export function getAggregatedLivenessScore(track: TrackedFace, frameCount = 5): number {
  if (track.livenessHistory.length === 0) {
    return 0;
  }

  // Use last N frames (or fewer if not available)
  const recentFrames = track.livenessHistory.slice(-frameCount);
  const sum = recentFrames.reduce((acc, frame) => acc + frame.finalLivenessScore, 0);

  return sum / recentFrames.length;
}

/**
 * Get track stability metrics for this frame
 * Returns object with multiple confidence measures
 */
export function getTrackStability(track: TrackedFace): {
  iouConfidence: number; // Tracking confidence from IoU
  frameConsistency: number; // Based on consecutive frames seen
  motionSmoothing: number; // Based on IoU pattern in history
} {
  // IoU confidence (0-1)
  const iouConfidence = track.trackingConfidence;

  // Frame consistency: normalize framesSeen to 0-1
  // Assume 30fps, 60 max frames = 2 seconds
  const frameConsistency = Math.min(track.framesSeen / 60, 1.0);

  // Motion smoothing: compute average IoU if we have it in liveness history
  // For now, use a simple heuristic based on frame count
  const motionSmoothing = track.livenessHistory.length > 0 ? Math.min(track.livenessHistory.length / 30, 1.0) : 0;

  return {
    iouConfidence,
    frameConsistency,
    motionSmoothing,
  };
}

/**
 * Get the best track from active tracks (for single-face scenarios)
 * Scores tracks by combined stability metrics
 */
export function getBestTrack(tracker: FaceTracker): TrackedFace | null {
  if (tracker.tracks.size === 0) {
    return null;
  }

  let bestTrack: TrackedFace | null = null;
  let bestScore = -1;

  for (const track of tracker.tracks.values()) {
    const stability = getTrackStability(track);
    // Weighted score: IoU (40%) + frameConsistency (40%) + motionSmoothing (20%)
    const score = stability.iouConfidence * 0.4 + stability.frameConsistency * 0.4 + stability.motionSmoothing * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestTrack;
}

/**
 * Clear all tracks (useful on frame drop or error recovery)
 */
export function clearTracks(tracker: FaceTracker): void {
  tracker.tracks.clear();
  tracker.nextTrackId = 1;
}
