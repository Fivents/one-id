import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class GoogleOAuthFailedError extends AppError {
  constructor(message = 'Google OAuth failed.', context?: Record<string, unknown>) {
    super({
      code: ErrorCode.GOOGLE_OAUTH_FAILED,
      message,
      httpStatus: 502,
      level: 'error',
      context,
    });
  }
}
