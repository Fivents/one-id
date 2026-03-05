import type { UpdateFeatureRequest } from '@/core/communication/requests/feature';

import { UpdateFeatureError, UpdateFeatureUseCase } from '../../use-cases/feature';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdateFeatureController {
  constructor(private readonly updateFeatureUseCase: UpdateFeatureUseCase) {}

  async handle(id: string, request: UpdateFeatureRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const feature = await this.updateFeatureUseCase.execute(id, request);

      return ok(feature.toJSON());
    } catch (error) {
      if (error instanceof UpdateFeatureError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
