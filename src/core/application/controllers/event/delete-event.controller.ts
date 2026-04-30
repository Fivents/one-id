import { AppError } from '@/core/errors';

import { DeleteEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteEventController {
  constructor(private readonly deleteEventUseCase: DeleteEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteEventUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
