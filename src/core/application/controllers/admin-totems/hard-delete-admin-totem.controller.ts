import { AppError } from '@/core/errors';

import { HardDeleteAdminTotemUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class HardDeleteAdminTotemController {
  constructor(private readonly hardDeleteAdminTotemUseCase: HardDeleteAdminTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.hardDeleteAdminTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
