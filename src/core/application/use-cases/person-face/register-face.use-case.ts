import {
  CreatePersonFaceData,
  IFaceQualityService,
  IPersonFaceRepository,
  ITemplateAggregationService,
  type TemplateData,
  type TemplatePosition,
} from '@/core/domain/contracts';
import type { PersonFaceEntity } from '@/core/domain/entities';
import { AppError } from '@/core/errors';
import { ErrorCode } from '@/core/errors/error-codes';

export interface RegisterFaceUseCaseInput extends CreatePersonFaceData {
  // Quality metadata from client (captured during enrollment)
  faceDetectionData?: Record<string, unknown>; // Raw face detection output for quality assessment
}

export interface RegisterFaceUseCaseResult {
  face: PersonFaceEntity;
  templateSetStatus?: {
    templateSetId: string;
    totalTemplates: number;
    complete: boolean;
    aggregatedEmbedding?: Buffer;
  };
}

export class RegisterFaceUseCase {
  constructor(
    private readonly personFaceRepository: IPersonFaceRepository,
    private readonly faceQualityService: IFaceQualityService,
    private readonly templateAggregationService: ITemplateAggregationService,
  ) {}

  async execute(data: RegisterFaceUseCaseInput): Promise<RegisterFaceUseCaseResult> {
    // ────── 1. Quality validation ──────────────────────────────────────
    if (data.faceDetectionData) {
      const qualityScore = this.faceQualityService.assessQuality(data.faceDetectionData);

      if (!this.faceQualityService.isQualityAcceptable(qualityScore)) {
        const feedback = this.faceQualityService.getQualityFeedback(qualityScore);
        throw new AppError({
          code: ErrorCode.INVALID_FACE_QUALITY,
          message: `Face quality too low. Score: ${qualityScore.overallScore.toFixed(2)}/1.00. ${feedback.join('; ')}`,
          httpStatus: 400,
          level: 'warning',
          context: {
            qualityScore: qualityScore.overallScore,
            threshold: 0.65,
            failures: qualityScore.assessmentDetails.failures,
          },
        });
      }

      // Pass quality data to repository
      data.faceQualityScore = qualityScore.overallScore;
      data.faceQualityMetadata = qualityScore.assessmentDetails;
    }

    // ────── 2. Template position handling ───────────────────────────────
    // If no position specified, default to "center" for first enrollment
    if (!data.templatePosition) {
      data.templatePosition = 'center';
    }

    // Get or create template set ID (Phase 2)
    let templateSetId = data.templateSetId;
    if (!templateSetId) {
      templateSetId = await this.personFaceRepository.getOrCreateTemplateSet(data.personId);
      data.templateSetId = templateSetId;
    }

    // ────── 3. Check for duplicate position ────────────────────────────
    const status = await this.personFaceRepository.findTemplateSetStatus(data.personId, templateSetId);
    if (status.positions.includes(data.templatePosition)) {
      throw new AppError({
        code: ErrorCode.INVALID_INPUT,
        message: `Face already enrolled for position "${data.templatePosition}". Delete the old one first.`,
        httpStatus: 409,
        level: 'warning',
        context: {
          position: data.templatePosition,
          currentPositions: status.positions,
        },
      });
    }

    // ────── 4. Create face record ──────────────────────────────────────
    const face = await this.personFaceRepository.create(data);

    // ────── 5. Phase 2: Check if template set is complete ───────────────
    const updatedStatus = await this.personFaceRepository.findTemplateSetStatus(data.personId, templateSetId);
    const isMultiTemplateComplete = updatedStatus.complete && updatedStatus.totalTemplates === 5;

    let aggregatedEmbedding: Buffer | undefined;

    if (isMultiTemplateComplete) {
      // Aggregate all templates
      const templates = await this.personFaceRepository.findByPersonAndTemplateSet(data.personId, templateSetId);

      const templateDataList: TemplateData[] = templates
        .filter((t) => t.faceQualityScore !== null && t.faceTemplatePosition !== null)
        .map((t) => ({
          faceId: t.id,
          position: t.faceTemplatePosition as TemplatePosition,
          embedding: t.embedding,
          faceQualityScore: t.faceQualityScore ?? 0,
        }));

      if (templateDataList.length === 5) {
        try {
          aggregatedEmbedding = this.templateAggregationService.averageEmbeddings(templateDataList);

          // TODO: In future, store aggregatedEmbedding as primary template for search
          // For now, best template is used during check-in
        } catch (error) {
          console.error('[RegisterFaceUseCase] Failed to aggregate templates:', error);
          // Don't fail the enrollment if aggregation fails
        }
      }
    }

    return {
      face,
      templateSetStatus:
        updatedStatus.totalTemplates > 0
          ? {
              templateSetId,
              totalTemplates: updatedStatus.totalTemplates,
              complete: isMultiTemplateComplete,
              aggregatedEmbedding,
            }
          : undefined,
    };
  }
}
