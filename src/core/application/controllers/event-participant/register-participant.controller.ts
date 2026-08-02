import type { CreateEventParticipantData } from '@/core/domain/contracts';
import { AppError } from '@/core/errors';

import { RegisterParticipantUseCase } from '../../use-cases/event-participant';
import { badRequest, type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterParticipantController {
  constructor(private readonly registerParticipantUseCase: RegisterParticipantUseCase) {}

  async handle(request: Partial<CreateEventParticipantData>): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      if (!request.personId) {
        return badRequest('Person ID is required.');
      }

      if (!request.eventId) {
        return badRequest('Event ID is required.');
      }

      const participant = await this.registerParticipantUseCase.execute({
        personId: request.personId,
        eventId: request.eventId,
        company: request.company,
        jobTitle: request.jobTitle,
        qrCodeValue: request.qrCodeValue,
        accessCode: request.accessCode,
        useDocumentAsAccessCode: request.useDocumentAsAccessCode,
        accessCodeProvenance: request.accessCodeProvenance,
        qrCodeProvenance: request.qrCodeProvenance,
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
