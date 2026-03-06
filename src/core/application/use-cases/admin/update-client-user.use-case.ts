import type { UpdateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import type { IUserRepository } from '@/core/domain/contracts';
import { UserAlreadyExistsError, UserNotFoundError } from '@/core/errors';

const SUPER_ADMIN_DOMAIN = 'fivents.com';

export class UpdateClientUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, request: UpdateClientUserRequest): Promise<AdminUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    if (request.email && request.email !== user.email) {
      const existing = await this.userRepository.findByEmail(request.email);
      if (existing) {
        throw new UserAlreadyExistsError(request.email);
      }
    }

    const updated = await this.userRepository.update(id, {
      name: request.name,
      email: request.email,
    });

    const usersWithOrg = await this.userRepository.findAllWithOrganization();
    const userWithOrg = usersWithOrg.find((u) => u.id === id);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl ?? null,
      organizationId: userWithOrg?.organizationId ?? null,
      organizationName: userWithOrg?.organizationName ?? null,
      role: userWithOrg?.role ?? null,
      isSuperAdmin: updated.email.endsWith(`@${SUPER_ADMIN_DOMAIN}`) && userWithOrg?.role === 'SUPER_ADMIN',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
