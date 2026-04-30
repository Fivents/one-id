import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemAlreadyInactiveError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_ALREADY_INACTIVE,
      message: 'Totem is already inactive.',
      httpStatus: 409,
      level: 'info',
      context: totemId ? { totemId } : undefined,
    });
  }
}
