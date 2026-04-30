import { CheckTotemAvailabilityUseCase } from '../../use-cases/totem-organization-subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class CheckTotemAvailabilityController {
  constructor(private readonly checkTotemAvailabilityUseCase: CheckTotemAvailabilityUseCase) {}

  async handle(
    totemId: string,
    organizationId: string,
  ): Promise<ControllerResponse<{ available: boolean; activeSubscriptionId?: string }>> {
    try {
      const result = await this.checkTotemAvailabilityUseCase.execute(totemId, organizationId);

      return ok(result);
    } catch {
      return serverError();
    }
  }
}
