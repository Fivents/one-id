import type { LinkTotemToEventRequest } from '@/core/communication/requests/totem-event-subscription';

import { LinkTotemToEventError, LinkTotemToEventUseCase } from '../../use-cases/totem-event-subscription';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class LinkTotemToEventController {
  constructor(private readonly linkTotemToEventUseCase: LinkTotemToEventUseCase) {}

  async handle(request: LinkTotemToEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.linkTotemToEventUseCase.execute(request);

      return created(subscription.toJSON());
    } catch (error) {
      if (error instanceof LinkTotemToEventError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
