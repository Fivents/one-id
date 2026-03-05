import { AppError } from '@/core/errors';

import { ActivateEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ActivateEventController {
  constructor(private readonly activateEventUseCase: ActivateEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.activateEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
