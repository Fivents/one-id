import type { RegisterFaceRequest } from '@/core/communication/requests/person-face';
import { generateFaceImageFeatures } from '@/core/utils/face-image-features';

import { RegisterFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterFaceController {
  constructor(private readonly registerFaceUseCase: RegisterFaceUseCase) {}

  async handle(request: RegisterFaceRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const { embedding, imageHash, storedImageUrl } = await generateFaceImageFeatures({
        imageUrl: request.imageUrl,
        imageDataUrl: request.imageDataUrl,
      });

      const face = await this.registerFaceUseCase.execute({
        embedding,
        imageHash,
        imageUrl: storedImageUrl,
        personId: request.personId,
      });

      return created(face.toJSON());
    } catch {
      return serverError();
    }
  }
}
