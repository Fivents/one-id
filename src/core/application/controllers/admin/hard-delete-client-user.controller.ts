import { AppError } from '@/core/errors';

import { HardDeleteClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class HardDeleteClientUserController {
  constructor(private readonly hardDeleteClientUserUseCase: HardDeleteClientUserUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.hardDeleteClientUserUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
