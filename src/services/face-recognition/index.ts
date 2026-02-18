/**
 * Face Recognition Service
 *
 * Handles:
 * - Generating face embeddings from images (server-side)
 * - Comparing embeddings for participant recognition (cosine similarity)
 * - Embedding serialization/deserialization for Prisma Bytes storage
 *
 * Architecture:
 * - Embeddings are 128-dimensional Float32 vectors
 * - Stored as Bytes (Buffer) in PostgreSQL via Prisma
 * - Comparison uses cosine similarity with configurable threshold
 * - Liveness detection runs client-side on the totem (see totem components)
 */

const EMBEDDING_DIMENSIONS = 128;
const SIMILARITY_THRESHOLD = 0.6; // Minimum cosine similarity for a match
const HIGH_CONFIDENCE_THRESHOLD = 0.85;

// ============================================
// EMBEDDING SERIALIZATION
// ============================================

/**
 * Convert a Float32Array embedding to a Buffer for Prisma Bytes storage
 */
export function embeddingToBuffer(embedding: Float32Array | number[]): Buffer {
  const float32 = embedding instanceof Float32Array
    ? embedding
    : new Float32Array(embedding);

  if (float32.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding must have ${EMBEDDING_DIMENSIONS} dimensions, got ${float32.length}`
    );
  }

  return Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength);
}

/**
 * Convert a Prisma Bytes (Buffer) back to a Float32Array embedding
 */
export function bufferToEmbedding(buffer: Buffer | Uint8Array): Float32Array {
  const arrayBuffer = buffer instanceof Buffer
    ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return new Float32Array(arrayBuffer);
}

// ============================================
// SIMILARITY COMPARISON
// ============================================

/**
 * Calculate cosine similarity between two embeddings.
 * Returns a value between -1 and 1 (1 = identical, 0 = unrelated, -1 = opposite)
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate Euclidean distance between two embeddings.
 * Lower = more similar. Typical threshold: < 0.6 for match.
 */
export function euclideanDistance(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

// ============================================
// RECOGNITION
// ============================================

export interface ParticipantEmbedding {
  id: string;
  name: string;
  faceEmbedding: Buffer | Uint8Array;
}

export interface RecognitionResult {
  matched: boolean;
  participantId: string | null;
  participantName: string | null;
  confidence: number;
}

/**
 * Find the best matching participant from a list of stored embeddings.
 * Uses cosine similarity for matching.
 */
export function findBestMatch(
  queryEmbedding: Float32Array | number[],
  participants: ParticipantEmbedding[]
): RecognitionResult {
  const query = queryEmbedding instanceof Float32Array
    ? queryEmbedding
    : new Float32Array(queryEmbedding);

  let bestMatch: RecognitionResult = {
    matched: false,
    participantId: null,
    participantName: null,
    confidence: 0,
  };

  for (const participant of participants) {
    const stored = bufferToEmbedding(
      participant.faceEmbedding instanceof Buffer
        ? participant.faceEmbedding
        : Buffer.from(participant.faceEmbedding)
    );

    const similarity = cosineSimilarity(query, stored);

    if (similarity > bestMatch.confidence) {
      bestMatch = {
        matched: similarity >= SIMILARITY_THRESHOLD,
        participantId: participant.id,
        participantName: participant.name,
        confidence: similarity,
      };
    }
  }

  return bestMatch;
}

/**
 * Check if a recognition result is high confidence
 */
export function isHighConfidence(result: RecognitionResult): boolean {
  return result.matched && result.confidence >= HIGH_CONFIDENCE_THRESHOLD;
}

/**
 * Validate that a buffer contains a valid face embedding
 */
export function isValidEmbedding(buffer: Buffer | Uint8Array): boolean {
  const expectedBytes = EMBEDDING_DIMENSIONS * 4; // Float32 = 4 bytes each
  return buffer.byteLength === expectedBytes;
}

// ============================================
// CONSTANTS EXPORT
// ============================================

export const FACE_RECOGNITION_CONFIG = {
  EMBEDDING_DIMENSIONS,
  SIMILARITY_THRESHOLD,
  HIGH_CONFIDENCE_THRESHOLD,
  BYTES_PER_EMBEDDING: EMBEDDING_DIMENSIONS * 4,
} as const;
