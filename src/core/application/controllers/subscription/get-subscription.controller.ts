import { GetSubscriptionError, GetSubscriptionUseCase } from '../../use-cases/subscription';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetSubscriptionController {
  constructor(private readonly getSubscriptionUseCase: GetSubscriptionUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.getSubscriptionUseCase.execute(organizationId);

      return ok(subscription.toJSON());
    } catch (error) {
      if (error instanceof GetSubscriptionError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
