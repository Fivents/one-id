import { AppError } from '@/core/errors';

import { GetEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetEventController {
  constructor(private readonly getEventUseCase: GetEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.getEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
