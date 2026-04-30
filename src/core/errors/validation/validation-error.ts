import type { ZodError } from 'zod/v4';

import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class ValidationError extends AppError {
  public readonly errors: ZodError;

  constructor(errors: ZodError) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed.',
      httpStatus: 400,
      level: 'info',
      context: {
        errors: errors.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    this.errors = errors;
  }
}
