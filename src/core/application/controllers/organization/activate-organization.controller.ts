import { ActivateOrganizationError, ActivateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class ActivateOrganizationController {
  constructor(private readonly activateOrganizationUseCase: ActivateOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.activateOrganizationUseCase.execute(id);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof ActivateOrganizationError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
