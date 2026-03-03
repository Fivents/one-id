import { ZodError } from 'zod/v4';

import { AppError } from './app-error';

export class ZodValidationError extends AppError {
  code = 'ZOD_VALIDATION_ERROR';
  constructor(public errors: ZodError) {
    super({
      level: 'error',
      message: 'Validation failed.',
      metadata: {
        errors: errors.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }
}

export class LoginError extends AppError {
  code = 'LOGIN_ERROR';
  constructor() {
    super({
      message: 'Login failed.',
      level: 'error',
    });
  }
}

export class AuthError extends AppError {
  code = 'AUTH_ERROR';
  constructor() {
    super({
      message: 'Authentication failed.',
      level: 'warning',
    });
  }
}
