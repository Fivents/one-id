import { ListOrgTotemsUseCase } from '../../use-cases/totem-organization-subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListOrgTotemsController {
  constructor(private readonly listOrgTotemsUseCase: ListOrgTotemsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const subscriptions = await this.listOrgTotemsUseCase.execute(organizationId);

      return ok(subscriptions.map((s) => s.toJSON()));
    } catch {
      return serverError();
    }
  }
}
