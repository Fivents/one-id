import { AppError } from '@/core/errors';

import { GetTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetTotemController {
  constructor(private readonly getTotemUseCase: GetTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.getTotemUseCase.execute(id);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
