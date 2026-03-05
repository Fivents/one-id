import { DeleteOrganizationError, DeleteOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class DeleteOrganizationController {
  constructor(private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteOrganizationUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeleteOrganizationError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
