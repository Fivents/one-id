import type { UpdatePlanFeatureValueRequest } from '@/core/communication/requests/plan-feature';
import { AppError } from '@/core/errors';

import { UpdatePlanFeatureValueUseCase } from '../../use-cases/plan-feature';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdatePlanFeatureValueController {
  constructor(private readonly updatePlanFeatureValueUseCase: UpdatePlanFeatureValueUseCase) {}

  async handle(
    planId: string,
    featureId: string,
    request: UpdatePlanFeatureValueRequest,
  ): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const planFeature = await this.updatePlanFeatureValueUseCase.execute(planId, featureId, request.value);

      return ok(planFeature.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
