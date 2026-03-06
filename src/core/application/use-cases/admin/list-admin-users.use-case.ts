import type { AdminUserListResponse, AdminUserResponse } from '@/core/communication/responses/admin';
import type { IUserRepository } from '@/core/domain/contracts';

const SUPER_ADMIN_DOMAIN = 'fivents.com';

export class ListAdminUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<AdminUserListResponse> {
    const usersWithOrg = await this.userRepository.findAllWithOrganization();

    const users: AdminUserResponse[] = usersWithOrg.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      role: user.role,
      isSuperAdmin: user.email.endsWith(`@${SUPER_ADMIN_DOMAIN}`) && user.role === 'SUPER_ADMIN',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return { users, total: users.length };
  }
}
