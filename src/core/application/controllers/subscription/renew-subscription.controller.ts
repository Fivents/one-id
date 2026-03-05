import type { RenewSubscriptionRequest } from '@/core/communication/requests/subscription';

import { RenewSubscriptionError, RenewSubscriptionUseCase } from '../../use-cases/subscription';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class RenewSubscriptionController {
  constructor(private readonly renewSubscriptionUseCase: RenewSubscriptionUseCase) {}

  async handle(request: RenewSubscriptionRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.renewSubscriptionUseCase.execute(request);

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof RenewSubscriptionError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
