import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemAlreadyActiveError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_ALREADY_ACTIVE,
      message: 'Totem is already active.',
      httpStatus: 409,
      level: 'info',
      context: totemId ? { totemId } : undefined,
    });
  }
}
