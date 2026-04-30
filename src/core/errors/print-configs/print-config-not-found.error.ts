import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PrintConfigNotFoundError extends AppError {
  constructor(printConfigId?: string) {
    super({
      code: ErrorCode.PRINT_CONFIG_NOT_FOUND,
      message: 'Print config not found.',
      httpStatus: 404,
      level: 'warning',
      context: printConfigId ? { printConfigId } : undefined,
    });
  }
}
