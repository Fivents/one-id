import type { UpdatePersonRequest } from '@/core/communication/requests/person';
import { AppError } from '@/core/errors';

import { UpdatePersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdatePersonController {
  constructor(private readonly updatePersonUseCase: UpdatePersonUseCase) {}

  async handle(id: string, request: UpdatePersonRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const person = await this.updatePersonUseCase.execute(id, request);

      return ok(person.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
