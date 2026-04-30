import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class InvalidAccessCodeError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INVALID_ACCESS_CODE,
      message: 'Invalid access code.',
      httpStatus: 401,
      level: 'warning',
      context,
    });
  }
}
