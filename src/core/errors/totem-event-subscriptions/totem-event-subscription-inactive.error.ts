import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemEventSubscriptionInactiveError extends AppError {
  constructor(subscriptionId?: string) {
    super({
      code: ErrorCode.TOTEM_EVENT_SUBSCRIPTION_INACTIVE,
      message: 'Totem-event subscription is not active.',
      httpStatus: 409,
      level: 'warning',
      context: subscriptionId ? { subscriptionId } : undefined,
    });
  }
}
