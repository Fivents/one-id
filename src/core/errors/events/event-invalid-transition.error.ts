import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class EventInvalidTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super({
      code: ErrorCode.EVENT_INVALID_TRANSITION,
      message: `Cannot transition event from "${currentStatus}" to "${targetStatus}".`,
      httpStatus: 409,
      level: 'warning',
      context: { currentStatus, targetStatus },
    });
  }
}
