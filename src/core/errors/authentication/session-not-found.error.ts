import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SessionNotFoundError extends AppError {
  constructor(sessionId?: string) {
    super({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found.',
      httpStatus: 404,
      level: 'warning',
      context: sessionId ? { sessionId } : undefined,
    });
  }
}
