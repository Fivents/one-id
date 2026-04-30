import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class OrganizationAlreadyInactiveError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.ORGANIZATION_ALREADY_INACTIVE,
      message: 'Organization is already inactive.',
      httpStatus: 409,
      level: 'info',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
