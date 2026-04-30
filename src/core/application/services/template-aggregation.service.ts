import type { ITemplateAggregationService, TemplateData, TemplatePosition } from '@/core/domain/contracts';

/**
 * Template Aggregation Service
 *
 * Implements multi-pose enrollment aggregation for Phase 2.
 * Combines embeddings from 5 different poses into a single, robust template.
 */
export class TemplateAggregationService implements ITemplateAggregationService {
  // Pose value multipliers (how well suited for face recognition)
  private readonly POSE_VALUES: Record<TemplatePosition, number> = {
    center: 1.0, // Frontal face, best for matching
    left: 0.8, // Slight angle
    right: 0.8, // Slight angle
    up: 0.6, // Looking up
    down: 0.6, // Looking down
  };

  averageEmbeddings(templates: TemplateData[]): Buffer {
    if (templates.length === 0) {
      throw new Error('Cannot average zero embeddings');
    }

    // Convert all embeddings to Float32Array format
    const embeddings: Float32Array[] = templates.map((t) => {
      return new Float32Array(t.embedding.buffer, t.embedding.byteOffset, Math.floor(t.embedding.byteLength / 4));
    });

    // Calculate weights for each template
    const weights: number[] = templates.map((t) => this.calculateTemplateScore(t));

    // Normalize weights to sum to 1
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map((w) => w / weightSum);

    // Get embedding dimension (should be 512)
    const dimension = embeddings[0].length;

    // Calculate weighted average
    const averaged = new Float32Array(dimension);
    for (let i = 0; i < dimension; i += 1) {
      let sum = 0;
      for (let j = 0; j < embeddings.length; j += 1) {
        sum += embeddings[j][i] * normalizedWeights[j];
      }
      averaged[i] = sum;
    }

    // Normalize the resulting embedding (L2 normalization)
    return this.normalizeEmbedding(Buffer.from(averaged.buffer));
  }

  calculateTemplateScore(template: TemplateData): number {
    // Score = (quality × 0.7) + (pose_value × 0.3)
    // This weights quality more heavily but still values frontal faces
    const qualityComponent = template.faceQualityScore * 0.7;
    const poseComponent = this.getPoseValue(template.position) * 0.3;

    return Math.min(1, qualityComponent + poseComponent);
  }

  isTemplateSetComplete(templates: TemplateData[]): boolean {
    // Check if all 5 poses are present
    const positions = new Set(templates.map((t) => t.position));
    const requiredPositions: TemplatePosition[] = ['center', 'left', 'right', 'up', 'down'];

    for (const pos of requiredPositions) {
      if (!positions.has(pos)) {
        return false;
      }
    }

    // All poses present and all have quality scores
    return templates.every((t) => t.faceQualityScore > 0);
  }

  selectBestTemplate(templates: TemplateData[]): { faceId: string; position: TemplatePosition } {
    if (templates.length === 0) {
      throw new Error('No templates to select from');
    }

    // Prioritize by score (quality + pose value)
    let best = templates[0];
    let bestScore = this.calculateTemplateScore(best);

    for (const template of templates) {
      const score = this.calculateTemplateScore(template);
      if (score > bestScore) {
        best = template;
        bestScore = score;
      }
    }

    return {
      faceId: best.faceId,
      position: best.position,
    };
  }

  getPoseValue(position: TemplatePosition): number {
    return this.POSE_VALUES[position] ?? 0;
  }

  // ────── Private Helpers ──────

  /**
   * L2 normalize embedding vector.
   * Important for cosine similarity to work correctly.
   */
  private normalizeEmbedding(embedding: Buffer): Buffer {
    const vec = new Float32Array(embedding.buffer, embedding.byteOffset, Math.floor(embedding.byteLength / 4));

    // Calculate L2 norm
    let norm = 0;
    for (let i = 0; i < vec.length; i += 1) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);

    // Normalize
    if (norm > 0) {
      for (let i = 0; i < vec.length; i += 1) {
        vec[i] = vec[i] / norm;
      }
    }

    return Buffer.from(vec.buffer);
  }
}
