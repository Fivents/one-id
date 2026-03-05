import { GetOrganizationError, GetOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetOrganizationController {
  constructor(private readonly getOrganizationUseCase: GetOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.getOrganizationUseCase.execute(id);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof GetOrganizationError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
