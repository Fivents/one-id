import { AppError } from '@/core/errors';

import { RemoveParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RemoveParticipantController {
  constructor(private readonly removeParticipantUseCase: RemoveParticipantUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeParticipantUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
