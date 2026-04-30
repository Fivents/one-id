import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class OrganizationAlreadyExistsError extends AppError {
  constructor(slug?: string) {
    super({
      code: ErrorCode.ORGANIZATION_ALREADY_EXISTS,
      message: 'An organization with this slug already exists.',
      httpStatus: 409,
      level: 'warning',
      context: slug ? { slug } : undefined,
    });
  }
}
