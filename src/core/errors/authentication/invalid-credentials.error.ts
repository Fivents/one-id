import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class InvalidCredentialsError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid credentials.',
      httpStatus: 401,
      level: 'warning',
      context,
    });
  }
}
