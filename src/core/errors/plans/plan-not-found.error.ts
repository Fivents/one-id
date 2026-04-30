import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanNotFoundError extends AppError {
  constructor(planId?: string) {
    super({
      code: ErrorCode.PLAN_NOT_FOUND,
      message: 'Plan not found.',
      httpStatus: 404,
      level: 'warning',
      context: planId ? { planId } : undefined,
    });
  }
}
