import { DeleteTotemError, DeleteTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class DeleteTotemController {
  constructor(private readonly deleteTotemUseCase: DeleteTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeleteTotemError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
