import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class AdminDomainNotAllowedError extends AppError {
  constructor(domain?: string) {
    super({
      code: ErrorCode.ADMIN_DOMAIN_NOT_ALLOWED,
      message: domain
        ? `Email domain not authorized. Only @${domain} accounts are allowed.`
        : 'Email domain not authorized.',
      httpStatus: 401,
      level: 'warning',
      context: domain ? { domain } : undefined,
    });
  }
}
