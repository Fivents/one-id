import { ListPlansUseCase } from '../../use-cases/plan';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListPlansController {
  constructor(private readonly listPlansUseCase: ListPlansUseCase) {}

  async handle(activeOnly = false): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const plans = await this.listPlansUseCase.execute(activeOnly);

      return ok(plans.map((plan) => plan.toJSON()));
    } catch {
      return serverError();
    }
  }
}
