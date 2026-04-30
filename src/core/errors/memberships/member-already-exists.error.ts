import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class MemberAlreadyExistsError extends AppError {
  constructor(userId?: string, organizationId?: string) {
    super({
      code: ErrorCode.MEMBER_ALREADY_EXISTS,
      message: 'User is already a member of this organization.',
      httpStatus: 409,
      level: 'warning',
      context: { ...(userId && { userId }), ...(organizationId && { organizationId }) },
    });
  }
}
