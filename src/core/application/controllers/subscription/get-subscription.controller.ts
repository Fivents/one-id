import { AppError } from '@/core/errors';

import { GetSubscriptionUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetSubscriptionController {
  constructor(private readonly getSubscriptionUseCase: GetSubscriptionUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.getSubscriptionUseCase.execute(organizationId);

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
