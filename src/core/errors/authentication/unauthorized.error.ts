import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized.', context?: Record<string, unknown>) {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message,
      httpStatus: 401,
      level: 'warning',
      context,
    });
  }
}
