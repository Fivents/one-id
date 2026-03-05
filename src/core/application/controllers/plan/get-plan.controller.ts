import { GetPlanError, GetPlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetPlanController {
  constructor(private readonly getPlanUseCase: GetPlanUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const plan = await this.getPlanUseCase.execute(id);

      return ok(plan.toJSON());
    } catch (error) {
      if (error instanceof GetPlanError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
