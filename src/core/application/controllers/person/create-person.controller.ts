import type { CreatePersonRequest } from '@/core/communication/requests/person';

import { CreatePersonError, CreatePersonUseCase } from '../../use-cases/person';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class CreatePersonController {
  constructor(private readonly createPersonUseCase: CreatePersonUseCase) {}

  async handle(request: CreatePersonRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const person = await this.createPersonUseCase.execute(request);

      return created(person.toJSON());
    } catch (error) {
      if (error instanceof CreatePersonError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
