import { DeletePersonError, DeletePersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class DeletePersonController {
  constructor(private readonly deletePersonUseCase: DeletePersonUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deletePersonUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeletePersonError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
