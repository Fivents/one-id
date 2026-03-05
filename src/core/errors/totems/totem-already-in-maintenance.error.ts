import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemAlreadyInMaintenanceError extends AppError {
  constructor(totemId?: string) {
    super({
      code: ErrorCode.TOTEM_ALREADY_IN_MAINTENANCE,
      message: 'Totem is already in maintenance.',
      httpStatus: 409,
      level: 'info',
      context: totemId ? { totemId } : undefined,
    });
  }
}
