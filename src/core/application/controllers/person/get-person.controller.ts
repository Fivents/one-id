import { AppError } from '@/core/errors';

import { GetPersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetPersonController {
  constructor(private readonly getPersonUseCase: GetPersonUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const person = await this.getPersonUseCase.execute(id);

      return ok(person.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
