import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

interface SoftDeletedUserInfo {
  id: string;
  name: string;
  email: string;
}

export class UserSoftDeletedError extends AppError {
  public readonly softDeletedUser: SoftDeletedUserInfo;

  constructor(user: SoftDeletedUserInfo) {
    super({
      code: ErrorCode.USER_SOFT_DELETED,
      message: 'A soft-deleted user with this email already exists. Would you like to restore them?',
      httpStatus: 409,
      level: 'warning',
      context: { userId: user.id, email: user.email },
    });
    this.softDeletedUser = user;
  }
}
