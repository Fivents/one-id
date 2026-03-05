import { AppError } from '@/core/errors';

import { RemoveFeatureFromPlanUseCase } from '../../use-cases/plan-feature';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RemoveFeatureFromPlanController {
  constructor(private readonly removeFeatureFromPlanUseCase: RemoveFeatureFromPlanUseCase) {}

  async handle(planId: string, featureId: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeFeatureFromPlanUseCase.execute(planId, featureId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
