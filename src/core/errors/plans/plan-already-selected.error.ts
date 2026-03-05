import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanAlreadySelectedError extends AppError {
  constructor(planId?: string) {
    super({
      code: ErrorCode.PLAN_ALREADY_SELECTED,
      message: 'Cannot request change to the same plan.',
      httpStatus: 409,
      level: 'warning',
      context: planId ? { planId } : undefined,
    });
  }
}
