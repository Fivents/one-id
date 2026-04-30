import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanChangeRequestNotFoundError extends AppError {
  constructor(requestId?: string) {
    super({
      code: ErrorCode.PLAN_CHANGE_REQUEST_NOT_FOUND,
      message: 'Plan change request not found.',
      httpStatus: 404,
      level: 'warning',
      context: requestId ? { requestId } : undefined,
    });
  }
}
