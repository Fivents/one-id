import type { CreateSubscriptionRequest } from '@/core/communication/requests/subscription';
import { AppError } from '@/core/errors';

import { CreateSubscriptionUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateSubscriptionController {
  constructor(private readonly createSubscriptionUseCase: CreateSubscriptionUseCase) {}

  async handle(request: CreateSubscriptionRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.createSubscriptionUseCase.execute(request);

      return created(subscription.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
