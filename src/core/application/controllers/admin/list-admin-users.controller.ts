import type { AdminUserListResponse } from '@/core/communication/responses/admin';

import { ListAdminUsersUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListAdminUsersController {
  constructor(private readonly listAdminUsersUseCase: ListAdminUsersUseCase) {}

  async handle(): Promise<ControllerResponse<AdminUserListResponse>> {
    try {
      const result = await this.listAdminUsersUseCase.execute();

      return ok(result);
    } catch {
      return serverError();
    }
  }
}
