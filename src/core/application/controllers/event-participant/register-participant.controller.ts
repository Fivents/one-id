import type { RegisterParticipantRequest } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';

import { RegisterParticipantUseCase } from '../../use-cases/event-participant';
import { badRequest, type ControllerResponse,created, serverError } from '../controller-response';

export class RegisterParticipantController {
  constructor(private readonly registerParticipantUseCase: RegisterParticipantUseCase) {}

  async handle(request: RegisterParticipantRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      if (!request.personId) {
        return badRequest('Person ID is required.');
      }

      const participant = await this.registerParticipantUseCase.execute({
        personId: request.personId,
        eventId: request.eventId,
        company: request.company,
        jobTitle: request.jobTitle,
      });

      return created(participant.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
