import type { AssociateFeatureToPlanRequest } from '@/core/communication/requests/plan-feature';
import { AppError } from '@/core/errors';

import { AssociateFeatureToPlanUseCase } from '../../use-cases/plan-feature';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class AssociateFeatureToPlanController {
  constructor(private readonly associateFeatureToPlanUseCase: AssociateFeatureToPlanUseCase) {}

  async handle(request: AssociateFeatureToPlanRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const planFeature = await this.associateFeatureToPlanUseCase.execute(request);

      return created(planFeature.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
