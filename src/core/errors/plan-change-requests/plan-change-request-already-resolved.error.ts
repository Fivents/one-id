import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanChangeRequestAlreadyResolvedError extends AppError {
  constructor(requestId?: string) {
    super({
      code: ErrorCode.PLAN_CHANGE_REQUEST_ALREADY_RESOLVED,
      message: 'Request has already been resolved.',
      httpStatus: 409,
      level: 'warning',
      context: requestId ? { requestId } : undefined,
    });
  }
}
