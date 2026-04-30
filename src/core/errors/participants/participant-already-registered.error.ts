import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class ParticipantAlreadyRegisteredError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.PARTICIPANT_ALREADY_REGISTERED,
      message: 'Person is already registered for this event.',
      httpStatus: 409,
      level: 'warning',
      context,
    });
  }
}
