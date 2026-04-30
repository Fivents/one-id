import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class InvalidInputError extends AppError {
  constructor(message = 'Invalid input.', context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INVALID_INPUT,
      message,
      httpStatus: 400,
      level: 'info',
      context,
    });
  }
}
