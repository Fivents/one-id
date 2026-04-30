import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class ExternalServiceError extends AppError {
  constructor(message = 'An external service error occurred.', context?: Record<string, unknown>) {
    super({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      httpStatus: 502,
      level: 'error',
      context,
    });
  }
}
