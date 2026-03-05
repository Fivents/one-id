import { ListOrganizationsUseCase } from '../../use-cases/organization';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListOrganizationsController {
  constructor(private readonly listOrganizationsUseCase: ListOrganizationsUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const organizations = await this.listOrganizationsUseCase.execute();

      return ok(organizations.map((org) => org.toJSON()));
    } catch {
      return serverError();
    }
  }
}
