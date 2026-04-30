import type { CreateEventRequest } from '@/core/communication/requests/event';

import { CreateEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateEventController {
  constructor(private readonly createEventUseCase: CreateEventUseCase) {}

  async handle(request: CreateEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.createEventUseCase.execute(request);

      return created(event.toJSON());
    } catch {
      return serverError();
    }
  }
}
