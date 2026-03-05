import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SubscriptionNotActiveError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
      message: 'Subscription is not active.',
      httpStatus: 403,
      level: 'warning',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
