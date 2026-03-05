import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanChangeRequestPendingError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.PLAN_CHANGE_REQUEST_PENDING,
      message: 'Organization already has a pending plan change request.',
      httpStatus: 409,
      level: 'warning',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
