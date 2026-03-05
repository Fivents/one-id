import type { UpdateFeatureRequest } from '@/core/communication/requests/feature';
import { AppError } from '@/core/errors';

import { UpdateFeatureUseCase } from '../../use-cases/feature';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateFeatureController {
  constructor(private readonly updateFeatureUseCase: UpdateFeatureUseCase) {}

  async handle(id: string, request: UpdateFeatureRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const feature = await this.updateFeatureUseCase.execute(id, request);

      return ok(feature.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
