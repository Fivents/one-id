import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SymplaEventAlreadyLinkedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.SYMPLA_EVENT_ALREADY_LINKED,
      message: 'Este evento da Sympla já está vinculado a outro evento.',
      httpStatus: 409,
      level: 'warning',
      context,
    });
  }
}
