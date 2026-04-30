import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class AccessDisabledError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.ACCESS_DISABLED,
      message: 'Your access has been disabled. Contact your administrator.',
      httpStatus: 403,
      level: 'warning',
      context,
    });
  }
}
