import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class TotemAlreadyExistsError extends AppError {
  constructor(accessCode?: string) {
    super({
      code: ErrorCode.TOTEM_ALREADY_EXISTS,
      message: 'A totem with this access code already exists.',
      httpStatus: 409,
      level: 'warning',
      context: accessCode ? { accessCode } : undefined,
    });
  }
}
