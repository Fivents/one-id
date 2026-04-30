import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemAccessDeniedError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_ACCESS_DENIED,
      message: 'Totem is not active. Contact your administrator.',
      httpStatus: 403,
      level: 'warning',
      context: totemId ? { totemId } : undefined,
    });
  }
}
