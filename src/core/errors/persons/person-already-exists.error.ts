import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PersonAlreadyExistsError extends AppError {
  constructor(email?: string, organizationId?: string) {
    super({
      code: ErrorCode.PERSON_ALREADY_EXISTS,
      message: 'A person with this email already exists in this organization.',
      httpStatus: 409,
      level: 'warning',
      context: { ...(email && { email }), ...(organizationId && { organizationId }) },
    });
  }
}
