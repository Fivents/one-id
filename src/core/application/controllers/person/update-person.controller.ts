import type { UpdatePersonRequest } from '@/core/communication/requests/person';

import { UpdatePersonError, UpdatePersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdatePersonController {
  constructor(private readonly updatePersonUseCase: UpdatePersonUseCase) {}

  async handle(id: string, request: UpdatePersonRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const person = await this.updatePersonUseCase.execute(id, request);

      return ok(person.toJSON());
    } catch (error) {
      if (error instanceof UpdatePersonError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
