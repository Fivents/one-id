import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

export class ParticipantNotFoundError extends AppError {
  constructor(participantId?: string) {
    super({
      code: ErrorCode.PARTICIPANT_NOT_FOUND,
      message: 'Participant not found.',
      httpStatus: 404,
      level: 'warning',
      context: participantId ? { participantId } : undefined,
    });
  }
}
