import type { CreateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import type {
  IAuthIdentityRepository,
  IMembershipRepository,
  IOrganizationRepository,
  IPasswordHasher,
  IUserRepository,
} from '@/core/domain/contracts';
import { OrganizationAlreadyExistsError, UserAlreadyExistsError } from '@/core/errors';

export class CreateClientUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: CreateClientUserRequest): Promise<{ user: AdminUserResponse; temporaryPassword: string }> {
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      throw new UserAlreadyExistsError(request.email);
    }

    let organizationId = request.organizationId;
    let organizationName: string | null = null;

    if (!organizationId && request.organizationName) {
      const slug = request.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const existingOrg = await this.organizationRepository.findBySlug(slug);
      if (existingOrg) {
        throw new OrganizationAlreadyExistsError(slug);
      }

      const newOrg = await this.organizationRepository.create({
        name: request.organizationName,
        slug,
      });
      organizationId = newOrg.id;
      organizationName = newOrg.name;
    } else if (organizationId) {
      const org = await this.organizationRepository.findById(organizationId);
      organizationName = org?.name ?? null;
    }

    const user = await this.userRepository.create({
      name: request.name,
      email: request.email,
    });

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);

    await this.authIdentityRepository.create({
      provider: 'credentials',
      providerId: request.email,
      passwordHash,
      userId: user.id,
    });

    if (organizationId) {
      await this.membershipRepository.create({
        userId: user.id,
        organizationId,
        role: 'ORG_OWNER',
      });
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        organizationId: organizationId ?? null,
        organizationName,
        role: 'ORG_OWNER',
        isSuperAdmin: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      temporaryPassword,
    };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    for (let i = 0; i < 12; i++) {
      password += chars[array[i] % chars.length];
    }
    return password;
  }
}
