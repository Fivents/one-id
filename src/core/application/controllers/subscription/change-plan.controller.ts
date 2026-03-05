import type { ChangePlanRequest } from '@/core/communication/requests/subscription';
import { AppError } from '@/core/errors';

import { ChangePlanUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

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
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
