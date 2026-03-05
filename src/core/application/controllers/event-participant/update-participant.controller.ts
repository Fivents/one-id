import type { UpdateParticipantRequest } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';

import { UpdateParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateParticipantController {
  constructor(private readonly updateParticipantUseCase: UpdateParticipantUseCase) {}

  async handle(id: string, request: UpdateParticipantRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const participant = await this.updateParticipantUseCase.execute(id, request);

      return ok(participant.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
