import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class AuditLogNotFoundError extends AppError {
  constructor(auditLogId?: string) {
    super({
      code: ErrorCode.AUDIT_LOG_NOT_FOUND,
      message: 'Audit log not found.',
      httpStatus: 404,
      level: 'warning',
      context: auditLogId ? { auditLogId } : undefined,
    });
  }
}
