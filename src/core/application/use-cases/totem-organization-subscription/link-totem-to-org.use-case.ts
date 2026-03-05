import {
  IOrganizationRepository,
  ITotemOrganizationSubscriptionRepository,
  ITotemRepository,
} from '@/core/domain/contracts';
import type { TotemOrganizationSubscriptionEntity } from '@/core/domain/entities/totem-organization-subscription.entity';
import { OrganizationNotFoundError, TotemNotFoundError, TotemOrgSubscriptionAlreadyExistsError } from '@/core/errors';

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
      throw new TotemNotFoundError(input.totemId);
    }

    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    const existing = await this.totemOrgSubRepository.findActiveByTotemAndOrganization(
      input.totemId,
      input.organizationId,
    );

    if (existing) {
      throw new TotemOrgSubscriptionAlreadyExistsError(input.totemId, input.organizationId);
    }

    return this.totemOrgSubRepository.create({
      totemId: input.totemId,
      organizationId: input.organizationId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  }
}
