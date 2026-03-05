import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class InvalidSetupTokenError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INVALID_SETUP_TOKEN,
      message: 'Invalid setup token.',
      httpStatus: 400,
      level: 'warning',
      context,
    });
  }
}
