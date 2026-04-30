import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred.', context?: Record<string, unknown>) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      message,
      httpStatus: 500,
      level: 'critical',
      context,
    });
  }
}
