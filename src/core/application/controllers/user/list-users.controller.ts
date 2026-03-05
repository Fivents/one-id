import { ListUsersUseCase } from '../../use-cases/user';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListUsersController {
  constructor(private readonly listUsersUseCase: ListUsersUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const users = await this.listUsersUseCase.execute();

      return ok(users.map((user) => user.toJSON()));
    } catch {
      return serverError();
    }
  }
}
