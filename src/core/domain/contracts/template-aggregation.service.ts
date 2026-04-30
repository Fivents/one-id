/**
 * Template Aggregation Service Interface
 *
 * Handles multi-template enrollment aggregation in Phase 2.
 * When a person enrolls in 5 different poses, this service:
 * 1. Validates completion (all 5 poses collected)
 * 2. Weights embeddings by quality and pose
 * 3. Creates aggregated embedding (average)
 * 4. Selects best template for check-in matching
 *
 * Template Positions (POSE_VALUES):
 * - center:  1.0 (best, frontal face)
 * - left:    0.8
 * - right:   0.8
 * - up:      0.6
 * - down:    0.6
 */

export const VALID_TEMPLATE_POSITIONS = ['center', 'left', 'right', 'up', 'down'] as const;
export type TemplatePosition = (typeof VALID_TEMPLATE_POSITIONS)[number];

export interface TemplateData {
  faceId: string;
  position: TemplatePosition;
  embedding: Buffer;
  faceQualityScore: number; // 0-1
}

export interface TemplateSetStatus {
  personId: string;
  templateSetId: string;
  totalTemplates: number;
  positions: TemplatePosition[];
  complete: boolean;
  aggregatedEmbedding?: Buffer;
  bestTemplateId?: string;
  bestPosition?: TemplatePosition;
  bestQualityScore?: number;
}

export interface ITemplateAggregationService {
  /**
   * Calculate weighted average embedding from multiple poses.
   * Weights: quality_score × pose_value
   *
   * @param templates Array of face templates from different poses
   * @returns Aggregated embedding as Buffer (Float32Array)
   */
  averageEmbeddings(templates: TemplateData[]): Buffer;

  /**
   * Calculate composite score for a template.
   * Score = (quality_score × 0.7) + (pose_value × 0.3)
   *
   * @param template Template with quality and position
   * @returns Composite score 0-1
   */
  calculateTemplateScore(template: TemplateData): number;

  /**
   * Check if template set enrollment is complete (all 5 poses).
   *
   * @param templates Current templates
   * @returns true if all 5 poses present and non-null
   */
  isTemplateSetComplete(templates: TemplateData[]): boolean;

  /**
   * Select best template for check-in matching.
   * Prioritizes: quality → centrality → recency
   *
   * @param templates Available templates
   * @returns Best template ID and position
   */
  selectBestTemplate(templates: TemplateData[]): { faceId: string; position: TemplatePosition };

  /**
   * Get pose value multiplier for weighting.
   * Frontal (center) face is best for recognition.
   *
   * @param position Template position
   * @returns Weight 0-1
   */
  getPoseValue(position: TemplatePosition): number;
}
