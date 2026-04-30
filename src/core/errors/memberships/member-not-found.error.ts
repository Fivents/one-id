import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class MemberNotFoundError extends AppError {
  constructor(membershipId?: string) {
    super({
      code: ErrorCode.MEMBER_NOT_FOUND,
      message: 'Membership not found.',
      httpStatus: 404,
      level: 'warning',
      context: membershipId ? { membershipId } : undefined,
    });
  }
}
