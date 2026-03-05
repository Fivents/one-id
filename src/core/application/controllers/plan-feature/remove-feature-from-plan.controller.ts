import { RemoveFeatureFromPlanError, RemoveFeatureFromPlanUseCase } from '../../use-cases/plan-feature';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class RemoveFeatureFromPlanController {
  constructor(private readonly removeFeatureFromPlanUseCase: RemoveFeatureFromPlanUseCase) {}

  async handle(planId: string, featureId: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeFeatureFromPlanUseCase.execute(planId, featureId);

      return noContent();
    } catch (error) {
      if (error instanceof RemoveFeatureFromPlanError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
