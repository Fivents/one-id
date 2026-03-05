import type { RegisterFaceRequest } from '@/core/communication/requests/person-face';

import { RegisterFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterFaceController {
  constructor(private readonly registerFaceUseCase: RegisterFaceUseCase) {}

  async handle(request: RegisterFaceRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const face = await this.registerFaceUseCase.execute({
        embedding: Buffer.from(request.embedding, 'base64'),
        imageHash: request.imageHash,
        imageUrl: request.imageUrl,
        personId: request.personId,
      });

      return created(face.toJSON());
    } catch {
      return serverError();
    }
  }
}
