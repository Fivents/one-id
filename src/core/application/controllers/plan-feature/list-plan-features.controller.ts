import { ListPlanFeaturesUseCase } from '../../use-cases/plan-feature';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListPlanFeaturesController {
  constructor(private readonly listPlanFeaturesUseCase: ListPlanFeaturesUseCase) {}

  async handle(planId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const planFeatures = await this.listPlanFeaturesUseCase.execute(planId);

      return ok(planFeatures.map((pf) => pf.toJSON()));
    } catch {
      return serverError();
    }
  }
}
