import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SymplaNotConfiguredError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.SYMPLA_NOT_CONFIGURED,
      message: 'A integração Sympla não está configurada neste ambiente.',
      httpStatus: 503,
      level: 'error',
      context,
    });
  }
}
