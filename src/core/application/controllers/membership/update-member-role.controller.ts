import type { Role } from '@/core/domain/value-objects';

import { UpdateMemberRoleError, UpdateMemberRoleUseCase } from '../../use-cases/membership';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdateMemberRoleController {
  constructor(private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase) {}

  async handle(membershipId: string, role: Role): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const membership = await this.updateMemberRoleUseCase.execute(membershipId, role);

      return ok(membership.toJSON());
    } catch (error) {
      if (error instanceof UpdateMemberRoleError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
