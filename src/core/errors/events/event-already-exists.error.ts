import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class EventAlreadyExistsError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.EVENT_ALREADY_EXISTS,
      message: 'Event already exists.',
      httpStatus: 409,
      level: 'warning',
      context,
    });
  }
}
