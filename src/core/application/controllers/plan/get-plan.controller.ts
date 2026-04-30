import { AppError } from '@/core/errors';

import { GetPlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetPlanController {
  constructor(private readonly getPlanUseCase: GetPlanUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const plan = await this.getPlanUseCase.execute(id);

      return ok(plan.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
