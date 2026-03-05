import type { SetTotemLocationRequest } from '@/core/communication/requests/totem-event-subscription';
import { AppError } from '@/core/errors';

import { SetTotemLocationUseCase } from '../../use-cases/totem-event-subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class SetTotemLocationController {
  constructor(private readonly setTotemLocationUseCase: SetTotemLocationUseCase) {}

  async handle(
    subscriptionId: string,
    request: SetTotemLocationRequest,
  ): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.setTotemLocationUseCase.execute(subscriptionId, request.locationName);

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
