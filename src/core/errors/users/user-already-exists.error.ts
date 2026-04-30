import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class UserAlreadyExistsError extends AppError {
  constructor(email?: string) {
    super({
      code: ErrorCode.USER_ALREADY_EXISTS,
      message: 'A user with this email already exists.',
      httpStatus: 409,
      level: 'warning',
      context: email ? { email } : undefined,
    });
  }
}
