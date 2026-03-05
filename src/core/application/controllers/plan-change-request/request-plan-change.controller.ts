import type { RequestPlanChangeRequest } from '@/core/communication/requests/plan-change-request';

import { RequestPlanChangeError, RequestPlanChangeUseCase } from '../../use-cases/plan-change-request';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class RequestPlanChangeController {
  constructor(private readonly requestPlanChangeUseCase: RequestPlanChangeUseCase) {}

  async handle(request: RequestPlanChangeRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const planChangeRequest = await this.requestPlanChangeUseCase.execute(request);

      return created(planChangeRequest.toJSON());
    } catch (error) {
      if (error instanceof RequestPlanChangeError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
