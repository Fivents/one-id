import type { AdminUserListResponse } from '@/core/communication/responses/admin';

import { ListDeletedUsersUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListDeletedUsersController {
  constructor(private readonly listDeletedUsersUseCase: ListDeletedUsersUseCase) {}

  async handle(): Promise<ControllerResponse<AdminUserListResponse>> {
    try {
      const result = await this.listDeletedUsersUseCase.execute();

      return ok(result);
    } catch {
      return serverError();
    }
  }
}
