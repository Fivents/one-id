import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class OrganizationAlreadyActiveError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.ORGANIZATION_ALREADY_ACTIVE,
      message: 'Organization is already active.',
      httpStatus: 409,
      level: 'info',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
