import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemSessionNotFoundError extends AppError {
  constructor(sessionId?: string) {
    super({
      code: ErrorCode.TOTEM_SESSION_NOT_FOUND,
      message: 'Totem session not found.',
      httpStatus: 404,
      level: 'warning',
      context: sessionId ? { sessionId } : undefined,
    });
  }
}
