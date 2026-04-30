import { AppError } from '@/core/errors';

import { GetParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetParticipantController {
  constructor(private readonly getParticipantUseCase: GetParticipantUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const participant = await this.getParticipantUseCase.execute(id);

      return ok(participant.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
