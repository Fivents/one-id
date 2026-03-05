import type { CreateFeatureRequest } from '@/core/communication/requests/feature';

import { CreateFeatureError, CreateFeatureUseCase } from '../../use-cases/feature';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class CreateFeatureController {
  constructor(private readonly createFeatureUseCase: CreateFeatureUseCase) {}

  async handle(request: CreateFeatureRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const feature = await this.createFeatureUseCase.execute(request);

      return created(feature.toJSON());
    } catch (error) {
      if (error instanceof CreateFeatureError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
