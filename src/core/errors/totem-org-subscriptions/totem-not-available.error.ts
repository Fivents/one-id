import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemNotAvailableError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_NOT_AVAILABLE,
      message: 'Totem is not available.',
      httpStatus: 409,
      level: 'warning',
      context: totemId ? { totemId } : undefined,
    });
  }
}
