import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanFeatureNotFoundError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.PLAN_FEATURE_NOT_FOUND,
      message: 'Plan-feature association not found.',
      httpStatus: 404,
      level: 'warning',
      context,
    });
  }
}
