import type { CreateFeatureRequest } from '@/core/communication/requests/feature';
import { AppError } from '@/core/errors';

import { CreateFeatureUseCase } from '../../use-cases/feature';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateFeatureController {
  constructor(private readonly createFeatureUseCase: CreateFeatureUseCase) {}

  async handle(request: CreateFeatureRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const feature = await this.createFeatureUseCase.execute(request);

      return created(feature.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
