import type { CreateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import type { IMembershipRepository, IOrganizationRepository, IUserRepository } from '@/core/domain/contracts';
import { OrganizationAlreadyExistsError, UserAlreadyExistsError, UserSoftDeletedError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

export class CreateClientUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(request: CreateClientUserRequest): Promise<{ user: AdminUserResponse }> {
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      throw new UserAlreadyExistsError(request.email);
    }

    // Check if there's a soft-deleted user with the same email
    const softDeletedUser = await this.userRepository.findByEmailIncludingDeleted(request.email);
    if (softDeletedUser) {
      throw new UserSoftDeletedError({
        id: softDeletedUser.id,
        name: softDeletedUser.name,
        email: softDeletedUser.email,
      });
    }

    const role = request.role ?? 'ORG_OWNER';
    let organizationId = request.organizationId;
    let organizationName: string | null = null;
    let createdOrgId: string | null = null;

    if (!organizationId && request.organizationName) {
      const baseSlug = request.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const existingOrg = await this.organizationRepository.findBySlug(baseSlug);
      if (existingOrg) {
        throw new OrganizationAlreadyExistsError(baseSlug);
      }

      // Handle slug collision with soft-deleted orgs by appending a suffix
      let slug = baseSlug;
      let attempts = 0;
      let created = false;

      while (!created && attempts < 5) {
        try {
          const newOrg = await this.organizationRepository.create({
            name: request.organizationName,
            slug,
          });
          organizationId = newOrg.id;
          organizationName = newOrg.name;
          createdOrgId = newOrg.id;
          created = true;
        } catch {
          attempts++;
          slug = `${baseSlug}-${attempts}`;
        }
      }

      if (!created) {
        throw new OrganizationAlreadyExistsError(baseSlug);
      }
    } else if (organizationId) {
      const org = await this.organizationRepository.findById(organizationId);
      organizationName = org?.name ?? null;
    }

    let user;
    try {
      user = await this.userRepository.create({
        name: request.name,
        email: request.email,
      });
    } catch (error) {
      // Cleanup: soft-delete the org we just created to avoid orphan
      if (createdOrgId) {
        try {
          await this.organizationRepository.softDelete(createdOrgId);
        } catch (cleanupError) {
          Logger.error('Failed to cleanup org after user creation failure', { cleanupError }, 'AdminUsers');
        }
      }
      throw error;
    }

    if (organizationId) {
      try {
        await this.membershipRepository.create({
          userId: user.id,
          organizationId,
          role,
        });
      } catch (error) {
        // Cleanup: soft-delete user and org if membership fails
        try {
          await this.userRepository.softDelete(user.id);
          if (createdOrgId) {
            await this.organizationRepository.softDelete(createdOrgId);
          }
        } catch (cleanupError) {
          Logger.error('Failed to cleanup after membership creation failure', { cleanupError }, 'AdminUsers');
        }
        throw error;
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        organizationId: organizationId ?? null,
        organizationName,
        role,
        isSuperAdmin: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
