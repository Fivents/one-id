import { AppError } from '@/core/errors';

import { GetOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetOrganizationController {
  constructor(private readonly getOrganizationUseCase: GetOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.getOrganizationUseCase.execute(id);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
