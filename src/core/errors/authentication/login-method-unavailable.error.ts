import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class LoginMethodUnavailableError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.LOGIN_METHOD_UNAVAILABLE,
      message: 'This login method is not available for your account type.',
      httpStatus: 403,
      level: 'warning',
      context,
    });
  }
}
