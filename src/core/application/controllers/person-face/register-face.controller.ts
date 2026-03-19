import type { RegisterFaceRequest } from '@/core/communication/requests/person-face';

import { RegisterFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterFaceController {
  constructor(private readonly registerFaceUseCase: RegisterFaceUseCase) {}

  async handle(request: RegisterFaceRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const embedding = Buffer.from(new Float32Array(request.embedding).buffer);
      const imageHash = `runtime-embedding-${Date.now()}`;
      const storedImageUrl = request.imageUrl ?? 'captured://runtime-embedding';

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
