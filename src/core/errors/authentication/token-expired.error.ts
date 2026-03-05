import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TokenExpiredError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.TOKEN_EXPIRED,
      message: 'Token has expired.',
      httpStatus: 401,
      level: 'warning',
      context,
    });
  }
}
