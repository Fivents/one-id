import type { RegisterParticipantRequest } from '@/core/communication/requests/event-participant';

import { RegisterParticipantError, RegisterParticipantUseCase } from '../../use-cases/event-participant';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterParticipantController {
  constructor(private readonly registerParticipantUseCase: RegisterParticipantUseCase) {}

  async handle(request: RegisterParticipantRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const participant = await this.registerParticipantUseCase.execute(request);

      return created(participant.toJSON());
    } catch (error) {
      if (error instanceof RegisterParticipantError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
