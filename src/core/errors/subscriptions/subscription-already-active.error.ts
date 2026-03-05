import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SubscriptionAlreadyActiveError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.SUBSCRIPTION_ALREADY_ACTIVE,
      message: 'Organization already has an active subscription.',
      httpStatus: 409,
      level: 'warning',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
