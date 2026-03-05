import type { ResolvePlanChangeRequest } from '@/core/communication/requests/plan-change-request';

import { RejectRequestError, RejectRequestUseCase } from '../../use-cases/plan-change-request';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class RejectRequestController {
  constructor(private readonly rejectRequestUseCase: RejectRequestUseCase) {}

  async handle(request: ResolvePlanChangeRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const result = await this.rejectRequestUseCase.execute({
        requestId: request.requestId,
        resolvedById: request.resolvedById,
        resolvedNote: request.resolvedNote ?? undefined,
      });

      return ok(result.toJSON());
    } catch (error) {
      if (error instanceof RejectRequestError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
