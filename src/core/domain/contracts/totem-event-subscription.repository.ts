import type { TotemEventSubscriptionEntity } from '../entities/totem-event-subscription.entity';

export interface CreateTotemEventSubscriptionData {
  locationName: string;
  totemOrganizationSubscriptionId: string;
  eventId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ITotemEventSubscriptionRepository {
  findById(id: string): Promise<TotemEventSubscriptionEntity | null>;
  findByEvent(eventId: string): Promise<TotemEventSubscriptionEntity[]>;
  create(data: CreateTotemEventSubscriptionData): Promise<TotemEventSubscriptionEntity>;
}
