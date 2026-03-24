import type {
  IVectorDbRepository,
  SearchTopKInput,
  UpsertEmbeddingVectorInput,
  VectorSearchResult,
} from '@/core/domain/contracts';
import type { PrismaClient } from '@/generated/prisma/client';

/**
 * PostgreSQL + pgvector implementation of vector search.
 *
 * Uses:
 * - `vector` type for embeddings (512 dimensions)
 * - HNSW index for O(log n) search performance
 * - Cosine distance operator (`<=>`) for similarity
 *
 * Cosine distance formula:
 * - Distance 0 = identical vectors
 * - Distance 1 = orthogonal vectors
 * - Distance 2 = opposite vectors
 *
 * We convert to similarity: similarity = 1 - distance
 */
export class PostgresVectorDbRepository implements IVectorDbRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Insert or update embedding vector with metadata.
   * Handles conversion from Float32Array/Buffer to vector format.
   */
  async upsertEmbeddingVector(input: UpsertEmbeddingVectorInput): Promise<void> {
    const embeddingVector = this.normalizeEmbedding(input.embedding);

    // For Phase 1, use raw SQL for vector field (Prisma doesn't support Unsupported types in updates)
    await this.db.$executeRaw`
      INSERT INTO person_faces (
        id,
        embedding_vector,
        embedding_model_version,
        face_quality_score,
        person_id,
        image_url,
        image_hash,
        created_at,
        updated_at
      ) VALUES (
        ${input.faceId},
        ${embeddingVector}::vector,
        ${input.embeddingModelVersion},
        ${input.faceQualityScore},
        '',
        ${input.faceImageUrl ?? ''},
        ${input.faceId},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        embedding_vector = EXCLUDED.embedding_vector,
        embedding_model_version = EXCLUDED.embedding_model_version,
        face_quality_score = EXCLUDED.face_quality_score,
        updated_at = NOW()
    `;
  }

  /**
   * Vector similarity search using pgvector cosine distance.
   * NOW with multi-template support (Phase 2):
   * - For each person, searches ALL their templates
   * - Returns best match per person (best template across poses)
   * - Filters by quality and model version
   *
   * Query strategy:
   * 1. Find all active faces in event participants (including all templates)
   * 2. Sort by cosine distance (closer = smaller distance)
   * 3. For each person, keep only best template match
   * 4. Convert distance to similarity score
   * 5. Filter by threshold
   * 6. Limit to top-k
   *
   * Performance: O(log n) via HNSW index + efficient CTE
   */
  async searchTopK(input: SearchTopKInput): Promise<VectorSearchResult[]> {
    const embeddingVector = this.normalizeEmbedding(input.embedding);

    // Raw SQL query with CTE for multi-template support
    // ROW_NUMBER PARTITION BY person ensures we get best template per person
    const results = await this.db.$queryRaw<
      Array<{
        face_id: string;
        event_participant_id: string;
        person_name: string;
        company: string | null;
        job_title: string | null;
        face_image_url: string | null;
        template_position: string | null;
        confidence: number;
      }>
    >`
      WITH ranked_faces AS (
        SELECT
          pf.id as face_id,
          ep.id as event_participant_id,
          p.id as person_id,
          p.name as person_name,
          ep.company,
          ep.job_title,
          pf.image_url as face_image_url,
          pf.face_template_position as template_position,
          (1 - (pf.embedding_vector <=> ${embeddingVector}::vector)) as confidence,
          ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY (pf.embedding_vector <=> ${embeddingVector}::vector) ASC) as template_rank
        FROM person_faces pf
        INNER JOIN people p ON p.id = pf.person_id
        INNER JOIN event_participants ep ON ep.person_id = p.id
        WHERE
          ep.event_id = ${input.eventId}
          AND p.organization_id = ${input.organizationId}
          AND pf.is_active = true
          AND pf.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND ep.deleted_at IS NULL
          AND pf.embedding_vector IS NOT NULL
      )
      SELECT
        face_id,
        event_participant_id,
        person_name,
        company,
        job_title,
        face_image_url,
        template_position,
        confidence
      FROM ranked_faces
      WHERE template_rank = 1
        AND confidence >= ${input.threshold}
      ORDER BY confidence DESC
      LIMIT ${input.k}
    `;

    // Map database columns to VectorSearchResult
    return results.map((row) => ({
      faceId: row.face_id,
      eventParticipantId: row.event_participant_id,
      personName: row.person_name,
      company: row.company,
      jobTitle: row.job_title,
      faceImageUrl: row.face_image_url,
      confidence: row.confidence,
    }));
  }

  /**
   * Soft delete embedding (mark as inactive).
   */
  async deleteEmbedding(faceId: string): Promise<void> {
    await this.db.personFace.update({
      where: { id: faceId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Re-index event embeddings.
   * Used when upgrading to a new face detection model.
   *
   * Strategy:
   * 1. Find all active faces in event
   * 2. Clear embedding_model_version
   * 3. Re-process through face detection pipeline
   * 4. Update embeddings
   *
   * Note: Actual re-processing happens in batch job, not here.
   */
  async reindexEventEmbeddings(eventId: string): Promise<void> {
    // Mark embeddings for reprocessing
    await this.db.$executeRaw`
      UPDATE person_faces pf
      SET embedding_model_version = 'PENDING_REINDEX'
      WHERE pf.id IN (
        SELECT pf.id FROM person_faces pf
        INNER JOIN people p ON p.id = pf.person_id
        INNER JOIN event_participants ep ON ep.person_id = p.id
        WHERE ep.event_id = ${eventId}
        AND pf.is_active = true
        AND pf.deleted_at IS NULL
      )
    `;
  }

  /**
   * Get vector index statistics.
   */
  async getIndexStats(): Promise<{
    totalEmbeddings: number;
    indexSize: string;
    lastUpdated: Date;
  }> {
    const countResult = await this.db.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*) as count FROM person_faces WHERE embedding_vector IS NOT NULL`;

    const indexSizeResult = await this.db.$queryRaw<
      Array<{ pg_size_pretty: string }>
    >`
      SELECT pg_size_pretty(pg_total_relation_size('idx_person_faces_embedding_vector_hnsw')) as pg_size_pretty
    `;

    const lastFaceResult = await this.db.$queryRaw<
      Array<{ updated_at: Date }>
    >`
      SELECT updated_at FROM person_faces
      WHERE embedding_vector IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    return {
      totalEmbeddings: Number(countResult[0]?.count ?? 0),
      indexSize: indexSizeResult[0]?.pg_size_pretty ?? 'N/A',
      lastUpdated: lastFaceResult[0]?.updated_at ?? new Date(),
    };
  }

  /**
   * Convert embedding from different formats to pgvector string format.
   *
   * pgvector accepts: '[0.1, 0.2, 0.3, ...]'
   */
  private normalizeEmbedding(embedding: number[] | Buffer): string {
    let floats: Float32Array;

    if (Buffer.isBuffer(embedding)) {
      // Convert Buffer to Float32Array
      floats = new Float32Array(
        embedding.buffer,
        embedding.byteOffset,
        Math.floor(embedding.byteLength / 4),
      );
    } else if (Array.isArray(embedding)) {
      // Already array, convert to Float32Array for consistency
      floats = new Float32Array(embedding);
    } else {
      throw new Error('Invalid embedding format');
    }

    // Convert to pgvector string format: '[0.1, 0.2, 0.3, ...]'
    const values = Array.from(floats);
    return `[${values.join(',')}]`;
  }
}
