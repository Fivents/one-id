import { AppError } from '@/core/errors';

import { ActivateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ActivateOrganizationController {
  constructor(private readonly activateOrganizationUseCase: ActivateOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.activateOrganizationUseCase.execute(id);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
