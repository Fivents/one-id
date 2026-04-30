import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemNotFoundError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_NOT_FOUND,
      message: 'Totem not found.',
      httpStatus: 404,
      level: 'warning',
      context: totemId ? { totemId } : undefined,
    });
  }
}
