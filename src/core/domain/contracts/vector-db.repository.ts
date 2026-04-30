/**
 * Vector Database Repository Interface
 *
 * This interface abstracts vector similarity search operations.
 * Implementation uses PostgreSQL + pgvector for on-premise deployment.
 *
 * Future scaling path:
 * - Weaviate for 1M+ embeddings
 * - Pinecone for serverless vector search
 */

export interface VectorSearchResult {
  faceId: string;
  eventParticipantId: string;
  personName: string;
  company: string | null;
  jobTitle: string | null;
  faceImageUrl: string | null;
  confidence: number; // Cosine similarity score: 0-1 (1 = identical)
}

export interface UpsertEmbeddingVectorInput {
  faceId: string;
  embedding: number[] | Buffer;
  embeddingModelVersion: string; // e.g., "InsightFace:0.3.3"
  faceQualityScore: number; // 0-1
  eventParticipantId: string;
  personName: string;
  company: string | null;
  jobTitle: string | null;
  faceImageUrl: string | null;
  organizationId: string;
}

export interface SearchTopKInput {
  embedding: number[] | Buffer;
  eventId: string;
  organizationId: string;
  k: number; // Return top-k results
  threshold: number; // Minimum confidence (0-1)
}

export interface IVectorDbRepository {
  /**
   * Insert or update embedding vector with metadata.
   * Used during enrollment to index face embeddings.
   *
   * @param input Embedding data and metadata
   */
  upsertEmbeddingVector(input: UpsertEmbeddingVectorInput): Promise<void>;

  /**
   * Vector similarity search (cosine distance).
   * Returns top-k matching faces ordered by similarity.
   * Used during check-in to find candidate participants.
   *
   * Performance characteristics:
   * - 1k participants: <50ms (p95)
   * - 10k participants: <100ms (p95)
   * - 100k participants: <200ms (p95)
   *
   * @param input Search parameters
   * @returns Top-k matching results ordered by descending confidence
   */
  searchTopK(input: SearchTopKInput): Promise<VectorSearchResult[]>;

  /**
   * Delete embedding vector (soft delete).
   * Called when a face is deactivated or deleted.
   *
   * @param faceId Face identifier
   */
  deleteEmbedding(faceId: string): Promise<void>;

  /**
   * Re-index all embeddings for an event.
   * Used during model upgrades to reprocess all embeddings.
   *
   * @param eventId Event identifier
   */
  reindexEventEmbeddings(eventId: string): Promise<void>;

  /**
   * Get index statistics (size, performance metrics).
   * Used for monitoring and optimization.
   */
  getIndexStats(): Promise<{
    totalEmbeddings: number;
    indexSize: string;
    lastUpdated: Date;
  }>;
}
