import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PasswordNotConfiguredError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.PASSWORD_NOT_CONFIGURED,
      message: 'Password not configured. Please set up your password first.',
      httpStatus: 400,
      level: 'info',
      context,
    });
  }
}
