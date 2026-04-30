import type { UpdateSubscriptionRequest } from '@/core/communication/requests/subscription';

import { UpdateSubscriptionUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateSubscriptionController {
  constructor(private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase) {}

  async handle(id: string, request: UpdateSubscriptionRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.updateSubscriptionUseCase.execute(id, request);

      return ok(subscription.toJSON());
    } catch {
      return serverError();
    }
  }
}
