import type { PersonFaceEntity } from '../entities/person-face.entity';

export interface CreatePersonFaceData {
  embedding: Buffer;
  imageHash: string;
  imageUrl: string;
  personId: string;
  // Optional: Quality metadata from enrollment
  faceQualityScore?: number; // 0-1 composite score
  faceQualityMetadata?: Record<string, unknown>; // Quality assessment details
  embeddingModelVersion?: string; // Track model version for compatibility (default: InsightFace:0.3.3)
  templatePosition?: string; // For multi-template enrollment (e.g., "center", "left", "right")
  templateSetId?: string; // Group multiple pose enrollments (Phase 2)
}

export interface IPersonFaceRepository {
  findActiveByPerson(personId: string): Promise<PersonFaceEntity[]>;
  create(data: CreatePersonFaceData): Promise<PersonFaceEntity>;
  deactivate(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // NEW (Phase 2): Multi-template support
  /**
   * Find all faces in a template set by person and set ID.
   * Used for aggregating multi-pose enrollments.
   */
  findByPersonAndTemplateSet(
    personId: string,
    templateSetId: string,
  ): Promise<
    Array<{
      id: string;
      embedding: Buffer;
      faceQualityScore: number | null;
      faceTemplatePosition: string | null;
    }>
  >;

  /**
   * Get status of a template set - how many poses collected, which positions.
   */
  findTemplateSetStatus(
    personId: string,
    templateSetId: string,
  ): Promise<{
    totalTemplates: number;
    positions: string[];
    complete: boolean;
  }>;

  /**
   * Get or create a template set ID for multi-pose enrollment.
   */
  getOrCreateTemplateSet(personId: string): Promise<string>;
}
