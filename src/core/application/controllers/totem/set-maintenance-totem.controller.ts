import { AppError } from '@/core/errors';

import { SetMaintenanceTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class SetMaintenanceTotemController {
  constructor(private readonly setMaintenanceTotemUseCase: SetMaintenanceTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.setMaintenanceTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
