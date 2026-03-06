import type { RestoreClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import type { IMembershipRepository, IOrganizationRepository, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class RestoreClientUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(request: RestoreClientUserRequest): Promise<{ user: AdminUserResponse }> {
    const user = await this.userRepository.findByIdIncludingDeleted(request.userId);
    if (!user || !user.deletedAt) {
      throw new UserNotFoundError(request.userId);
    }

    const role = request.role ?? 'ORG_OWNER';
    const organizationId = request.organizationId;

    // Restore the user
    const restoredUser = await this.userRepository.restore(user.id, { name: request.name ?? user.name });

    // Handle membership
    let organizationName: string | null = null;
    if (organizationId) {
      const org = await this.organizationRepository.findById(organizationId);
      organizationName = org?.name ?? null;

      // Use createOrRestore to handle the unique constraint safely
      await this.membershipRepository.createOrRestore({
        userId: restoredUser.id,
        organizationId,
        role,
      });
    }

    return {
      user: {
        id: restoredUser.id,
        name: restoredUser.name,
        email: restoredUser.email,
        avatarUrl: restoredUser.avatarUrl ?? null,
        organizationId: organizationId ?? null,
        organizationName,
        role,
        isSuperAdmin: false,
        createdAt: restoredUser.createdAt,
        updatedAt: restoredUser.updatedAt,
      },
    };
  }
}
