import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class InsufficientPermissionsError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INSUFFICIENT_PERMISSIONS,
      message: 'Insufficient permissions.',
      httpStatus: 403,
      level: 'warning',
      context,
    });
  }
}
