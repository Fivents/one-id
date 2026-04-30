import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemOrgSubscriptionAlreadyExistsError extends AppError {
  constructor(totemId?: string, organizationId?: string) {
    super({
      code: ErrorCode.TOTEM_ORG_SUBSCRIPTION_ALREADY_EXISTS,
      message: 'Totem is already linked to this organization.',
      httpStatus: 409,
      level: 'warning',
      context: { ...(totemId && { totemId }), ...(organizationId && { organizationId }) },
    });
  }
}
