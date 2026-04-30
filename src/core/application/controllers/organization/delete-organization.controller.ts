import { AppError } from '@/core/errors';

import { DeleteOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteOrganizationController {
  constructor(private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteOrganizationUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
