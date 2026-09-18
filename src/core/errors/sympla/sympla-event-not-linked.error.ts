import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SymplaEventNotLinkedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.SYMPLA_EVENT_NOT_LINKED,
      message: 'Este evento não está vinculado a um evento da Sympla.',
      httpStatus: 404,
      level: 'warning',
      context,
    });
  }
}
