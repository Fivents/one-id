import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class OrganizationNotFoundError extends AppError {
  constructor(organizationId?: string) {
    super({
      code: ErrorCode.ORGANIZATION_NOT_FOUND,
      message: 'Organization not found.',
      httpStatus: 404,
      level: 'warning',
      context: organizationId ? { organizationId } : undefined,
    });
  }
}
