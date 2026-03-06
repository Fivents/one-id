import { BulkSoftDeleteUsersUseCase } from '../../use-cases/admin';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class BulkSoftDeleteUsersController {
  constructor(private readonly bulkSoftDeleteUsersUseCase: BulkSoftDeleteUsersUseCase) {}

  async handle(userIds: string[]): Promise<ControllerResponse<null>> {
    try {
      await this.bulkSoftDeleteUsersUseCase.execute(userIds);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
