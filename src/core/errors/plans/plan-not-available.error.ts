import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanNotAvailableError extends AppError {
  constructor(planId?: string) {
    super({
      code: ErrorCode.PLAN_NOT_AVAILABLE,
      message: 'Plan is not available.',
      httpStatus: 409,
      level: 'warning',
      context: planId ? { planId } : undefined,
    });
  }
}
