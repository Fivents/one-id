import type { RequestPlanChangeRequest } from '@/core/communication/requests/plan-change-request';
import { AppError } from '@/core/errors';

import { RequestPlanChangeUseCase } from '../../use-cases/plan-change-request';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RequestPlanChangeController {
  constructor(private readonly requestPlanChangeUseCase: RequestPlanChangeUseCase) {}

  async handle(request: RequestPlanChangeRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const planChangeRequest = await this.requestPlanChangeUseCase.execute(request);

      return created(planChangeRequest.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
