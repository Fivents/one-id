import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanAlreadyInactiveError extends AppError {
  constructor(planId?: string) {
    super({
      code: ErrorCode.PLAN_ALREADY_INACTIVE,
      message: 'Plan is already inactive.',
      httpStatus: 409,
      level: 'warning',
      context: planId ? { planId } : undefined,
    });
  }
}
