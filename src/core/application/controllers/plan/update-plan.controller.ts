import type { UpdatePlanRequest } from '@/core/communication/requests/plan';

import { UpdatePlanError, UpdatePlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdatePlanController {
  constructor(private readonly updatePlanUseCase: UpdatePlanUseCase) {}

  async handle(id: string, request: UpdatePlanRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const plan = await this.updatePlanUseCase.execute(id, request);

      return ok(plan.toJSON());
    } catch (error) {
      if (error instanceof UpdatePlanError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
