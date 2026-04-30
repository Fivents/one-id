import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class UserNotFoundError extends AppError {
  constructor(userId?: string) {
    super({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found.',
      httpStatus: 404,
      level: 'warning',
      context: userId ? { userId } : undefined,
    });
  }
}
