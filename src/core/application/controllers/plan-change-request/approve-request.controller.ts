import type { ResolvePlanChangeRequest } from '@/core/communication/requests/plan-change-request';

import { ApproveRequestError, ApproveRequestUseCase } from '../../use-cases/plan-change-request';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class ApproveRequestController {
  constructor(private readonly approveRequestUseCase: ApproveRequestUseCase) {}

  async handle(request: ResolvePlanChangeRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const result = await this.approveRequestUseCase.execute({
        requestId: request.requestId,
        resolvedById: request.resolvedById,
        resolvedNote: request.resolvedNote ?? undefined,
      });

      return ok(result.toJSON());
    } catch (error) {
      if (error instanceof ApproveRequestError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
