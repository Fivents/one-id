import type { CreateSubscriptionRequest } from '@/core/communication/requests/subscription';

import { CreateSubscriptionError, CreateSubscriptionUseCase } from '../../use-cases/subscription';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class CreateSubscriptionController {
  constructor(private readonly createSubscriptionUseCase: CreateSubscriptionUseCase) {}

  async handle(request: CreateSubscriptionRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.createSubscriptionUseCase.execute(request);

      return created(subscription.toJSON());
    } catch (error) {
      if (error instanceof CreateSubscriptionError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
