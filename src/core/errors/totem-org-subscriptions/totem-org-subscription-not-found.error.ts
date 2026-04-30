import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemOrgSubscriptionNotFoundError extends AppError {
  constructor(subscriptionId?: string) {
    super({
      code: ErrorCode.TOTEM_ORG_SUBSCRIPTION_NOT_FOUND,
      message: 'Totem-organization subscription not found.',
      httpStatus: 404,
      level: 'warning',
      context: subscriptionId ? { subscriptionId } : undefined,
    });
  }
}
