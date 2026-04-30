import type { LinkTotemToEventRequest } from '@/core/communication/requests/totem-event-subscription';
import { AppError } from '@/core/errors';

import { LinkTotemToEventUseCase } from '../../use-cases/totem-event-subscription';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class LinkTotemToEventController {
  constructor(private readonly linkTotemToEventUseCase: LinkTotemToEventUseCase) {}

  async handle(request: LinkTotemToEventRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.linkTotemToEventUseCase.execute(request);

      return created(subscription.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
