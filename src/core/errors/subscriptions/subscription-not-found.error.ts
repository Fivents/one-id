import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SubscriptionNotFoundError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
      message: 'Subscription not found.',
      httpStatus: 404,
      level: 'warning',
      context,
    });
  }
}
