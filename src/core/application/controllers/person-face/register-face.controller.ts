import type { RegisterFaceRequest } from '@/core/communication/requests/person-face';
import { AppError } from '@/core/errors';
import { generateImageHash } from '@/core/infrastructure/utils/hashing';

import { RegisterFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterFaceController {
  constructor(private readonly registerFaceUseCase: RegisterFaceUseCase) {}

  async handle(request: RegisterFaceRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const embedding = Buffer.from(new Float32Array(request.embedding).buffer);
      // Use proper image hash based on embedding content (deduplication)
      const imageHash = generateImageHash(request.embedding);
      const storedImageUrl = request.imageUrl ?? 'captured://runtime-embedding';

      const result = await this.registerFaceUseCase.execute({
        embedding,
        imageHash,
        imageUrl: storedImageUrl,
        personId: request.personId,
        embeddingModelVersion: request.embeddingModel,
        // Pass quality assessment data if provided by client
        faceDetectionData: request.faceDetectionData,
        // Phase 2: Pass template position and set ID
        templatePosition: request.templatePosition,
        templateSetId: request.templateSetId,
      });

      return created({
        face: result.face.toJSON(),
        // Return template status if multi-template enrollment
        ...(result.templateSetStatus && {
          templateSetStatus: {
            templateSetId: result.templateSetStatus.templateSetId,
            totalTemplates: result.templateSetStatus.totalTemplates,
            complete: result.templateSetStatus.complete,
            // Don't return raw embedding, just indicate completion
            aggregated: !!result.templateSetStatus.aggregatedEmbedding,
          },
        }),
      });
    } catch (error) {
      if (error instanceof AppError) {
        return {
          statusCode: error.httpStatus,
          body: { error: error.message, code: error.code },
        };
      }

      console.error('[RegisterFaceController] Error:', error);
      return serverError();
    }
  }
}
