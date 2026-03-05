import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class EventNotFoundError extends AppError {
  constructor(eventId?: string) {
    super({
      code: ErrorCode.EVENT_NOT_FOUND,
      message: 'Event not found.',
      httpStatus: 404,
      level: 'warning',
      context: eventId ? { eventId } : undefined,
    });
  }
}
