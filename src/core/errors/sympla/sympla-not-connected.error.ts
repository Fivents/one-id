import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class SymplaNotConnectedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: ErrorCode.SYMPLA_NOT_CONNECTED,
      message: 'Esta organização não possui uma conexão Sympla ativa.',
      httpStatus: 404,
      level: 'warning',
      context,
    });
  }
}
