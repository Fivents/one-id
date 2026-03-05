import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class FeatureAlreadyExistsError extends AppError {
  constructor(code?: string) {
    super({
      code: ErrorCode.FEATURE_ALREADY_EXISTS,
      message: 'A feature with this code already exists.',
      httpStatus: 409,
      level: 'warning',
      context: code ? { featureCode: code } : undefined,
    });
  }
}
