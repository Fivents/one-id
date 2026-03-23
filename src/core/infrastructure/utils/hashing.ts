import { createHash } from 'node:crypto';

/**
 * Generate deterministic hash for embedding vector.
 * Used for deduplication - same embedding always produces same hash.
 * This allows detecting if a person tries to register the same face twice.
 *
 * @param embedding 512-dimensional embedding array
 * @returns SHA-256 hash of embedding
 */
export function generateImageHash(embedding: number[]): string {
  // Convert embedding to deterministic string representation
  const embeddingString = embedding.map((v) => v.toFixed(6)).join(',');

  // Generate SHA-256 hash
  return createHash('sha256').update(embeddingString).digest('hex');
}
