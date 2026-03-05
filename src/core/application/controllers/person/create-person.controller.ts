import type { CreatePersonRequest } from '@/core/communication/requests/person';
import { AppError } from '@/core/errors';

import { CreatePersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreatePersonController {
  constructor(private readonly createPersonUseCase: CreatePersonUseCase) {}

  async handle(request: CreatePersonRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const person = await this.createPersonUseCase.execute(request);

      return created(person.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
