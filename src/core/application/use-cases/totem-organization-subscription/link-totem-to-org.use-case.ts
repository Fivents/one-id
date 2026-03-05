import {
  IOrganizationRepository,
  ITotemOrganizationSubscriptionRepository,
  ITotemRepository,
} from '@/core/domain/contracts';
import type { TotemOrganizationSubscriptionEntity } from '@/core/domain/entities/totem-organization-subscription.entity';

interface LinkTotemToOrgInput {
  totemId: string;
  organizationId: string;
  startsAt: Date;
  endsAt: Date;
}

export class LinkTotemToOrgUseCase {
  constructor(
    private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository,
    private readonly totemRepository: ITotemRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: LinkTotemToOrgInput): Promise<TotemOrganizationSubscriptionEntity> {
    const totem = await this.totemRepository.findById(input.totemId);
    if (!totem) {
      throw new LinkTotemToOrgError('Totem not found.');
    }

    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new LinkTotemToOrgError('Organization not found.');
    }

    const existing = await this.totemOrgSubRepository.findActiveByTotemAndOrganization(
      input.totemId,
      input.organizationId,
    );

    if (existing) {
      throw new LinkTotemToOrgError('Totem is already linked to this organization.');
    }

    return this.totemOrgSubRepository.create({
      totemId: input.totemId,
      organizationId: input.organizationId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  }
}

export class LinkTotemToOrgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinkTotemToOrgError';
  }
}
