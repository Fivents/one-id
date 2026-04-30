import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PlanFeatureAlreadyExistsError extends AppError {
  constructor(planId?: string, featureId?: string) {
    super({
      code: ErrorCode.PLAN_FEATURE_ALREADY_EXISTS,
      message: 'Feature is already associated with this plan.',
      httpStatus: 409,
      level: 'warning',
      context: { ...(planId && { planId }), ...(featureId && { featureId }) },
    });
  }
}
