import type { UpdateEventRequest } from '@/core/communication/requests/event';
import { AppError } from '@/core/errors';

import { UpdateEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateEventController {
  constructor(private readonly updateEventUseCase: UpdateEventUseCase) {}

  async handle(id: string, request: UpdateEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.updateEventUseCase.execute(id, request);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
