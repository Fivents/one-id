import type { RegisterParticipantRequest } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';

import { RegisterParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterParticipantController {
  constructor(private readonly registerParticipantUseCase: RegisterParticipantUseCase) {}

  async handle(request: RegisterParticipantRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const participant = await this.registerParticipantUseCase.execute(request);

      return created(participant.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
