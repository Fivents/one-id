import type { RenewSubscriptionRequest } from '@/core/communication/requests/subscription';
import { AppError } from '@/core/errors';

import { RenewSubscriptionUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class RenewSubscriptionController {
  constructor(private readonly renewSubscriptionUseCase: RenewSubscriptionUseCase) {}

  async handle(request: RenewSubscriptionRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.renewSubscriptionUseCase.execute(request);

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
