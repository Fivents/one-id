import type { CreatePlanRequest } from '@/core/communication/requests/plan';

import { CreatePlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreatePlanController {
  constructor(private readonly createPlanUseCase: CreatePlanUseCase) {}

  async handle(request: CreatePlanRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const plan = await this.createPlanUseCase.execute(request);

      return created(plan.toJSON());
    } catch {
      return serverError();
    }
  }
}
