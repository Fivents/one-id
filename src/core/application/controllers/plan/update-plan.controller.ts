import type { UpdatePlanRequest } from '@/core/communication/requests/plan';
import { AppError } from '@/core/errors';

import { UpdatePlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdatePlanController {
  constructor(private readonly updatePlanUseCase: UpdatePlanUseCase) {}

  async handle(id: string, request: UpdatePlanRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const plan = await this.updatePlanUseCase.execute(id, request);

      return ok(plan.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
