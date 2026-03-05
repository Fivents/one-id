import { DeleteUserError, DeleteUserUseCase } from '../../use-cases/user';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class DeleteUserController {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteUserUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeleteUserError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
