import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemEventSubscriptionNotFoundError extends AppError {
  constructor(subscriptionId?: string) {
    super({
      code: ErrorCode.TOTEM_EVENT_SUBSCRIPTION_NOT_FOUND,
      message: 'Totem-event subscription not found.',
      httpStatus: 404,
      level: 'warning',
      context: subscriptionId ? { subscriptionId } : undefined,
    });
  }
}
