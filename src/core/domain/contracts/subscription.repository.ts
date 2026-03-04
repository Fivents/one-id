import type { SubscriptionEntity } from '../entities/subscription.entity';

export interface CreateSubscriptionData {
  organizationId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
}

export interface UpdateSubscriptionData {
  planId?: string;
  expiresAt?: Date;
}

export interface ISubscriptionRepository {
  findByOrganization(organizationId: string): Promise<SubscriptionEntity | null>;
  create(data: CreateSubscriptionData): Promise<SubscriptionEntity>;
  update(id: string, data: UpdateSubscriptionData): Promise<SubscriptionEntity>;
}
