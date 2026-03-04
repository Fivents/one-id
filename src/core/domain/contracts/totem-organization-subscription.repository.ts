import type { TotemOrganizationSubscriptionEntity } from '../entities/totem-organization-subscription.entity';

export interface CreateTotemOrganizationSubscriptionData {
  totemId: string;
  organizationId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ITotemOrganizationSubscriptionRepository {
  findById(id: string): Promise<TotemOrganizationSubscriptionEntity | null>;
  findByOrganization(organizationId: string): Promise<TotemOrganizationSubscriptionEntity[]>;
  findActiveByTotemAndOrganization(
    totemId: string,
    organizationId: string,
  ): Promise<TotemOrganizationSubscriptionEntity | null>;
  create(data: CreateTotemOrganizationSubscriptionData): Promise<TotemOrganizationSubscriptionEntity>;
}
