import { AppError } from '@/core/errors';

import { CompleteEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class CompleteEventController {
  constructor(private readonly completeEventUseCase: CompleteEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.completeEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
