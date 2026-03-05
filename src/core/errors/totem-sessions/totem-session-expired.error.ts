import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemSessionExpiredError extends AppError {
  constructor(sessionId?: string) {
    super({
      code: ErrorCode.TOTEM_SESSION_EXPIRED,
      message: 'Totem session has expired.',
      httpStatus: 401,
      level: 'warning',
      context: sessionId ? { sessionId } : undefined,
    });
  }
}
