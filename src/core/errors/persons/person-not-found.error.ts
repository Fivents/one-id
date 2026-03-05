import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class PersonNotFoundError extends AppError {
  constructor(personId?: string) {
    super({
      code: ErrorCode.PERSON_NOT_FOUND,
      message: 'Person not found.',
      httpStatus: 404,
      level: 'warning',
      context: personId ? { personId } : undefined,
    });
  }
}
