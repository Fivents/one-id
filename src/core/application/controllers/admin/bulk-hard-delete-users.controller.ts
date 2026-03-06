import { BulkHardDeleteUsersUseCase } from '../../use-cases/admin';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class BulkHardDeleteUsersController {
  constructor(private readonly bulkHardDeleteUsersUseCase: BulkHardDeleteUsersUseCase) {}

  async handle(userIds: string[]): Promise<ControllerResponse<null>> {
    try {
      await this.bulkHardDeleteUsersUseCase.execute(userIds);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
