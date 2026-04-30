import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class FeatureNotFoundError extends AppError {
  constructor(featureId?: string) {
    super({
      code: ErrorCode.FEATURE_NOT_FOUND,
      message: 'Feature not found.',
      httpStatus: 404,
      level: 'warning',
      context: featureId ? { featureId } : undefined,
    });
  }
}
