import type { ChangePlanRequest } from '@/core/communication/requests/subscription';

import { ChangePlanError, ChangePlanUseCase } from '../../use-cases/subscription';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class ChangePlanController {
  constructor(private readonly changePlanUseCase: ChangePlanUseCase) {}

  async handle(request: ChangePlanRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.changePlanUseCase.execute({
        organizationId: request.organizationId,
        newPlanId: request.newPlanId,
      });

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof ChangePlanError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
