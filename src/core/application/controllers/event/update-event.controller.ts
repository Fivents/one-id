import type { UpdateEventRequest } from '@/core/communication/requests/event';

import { UpdateEventError, UpdateEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdateEventController {
  constructor(private readonly updateEventUseCase: UpdateEventUseCase) {}

  async handle(id: string, request: UpdateEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.updateEventUseCase.execute(id, request);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof UpdateEventError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
