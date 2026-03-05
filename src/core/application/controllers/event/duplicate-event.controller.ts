import type { DuplicateEventRequest } from '@/core/communication/requests/event';

import { DuplicateEventError, DuplicateEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, created, notFound, serverError } from '../controller-response';

export class DuplicateEventController {
  constructor(private readonly duplicateEventUseCase: DuplicateEventUseCase) {}

  async handle(id: string, request: DuplicateEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.duplicateEventUseCase.execute(id, request);

      return created(event.toJSON());
    } catch (error) {
      if (error instanceof DuplicateEventError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
