import {
  IEventRepository,
  ITotemEventSubscriptionRepository,
  ITotemOrganizationSubscriptionRepository,
} from '@/core/domain/contracts';
import type { TotemEventSubscriptionEntity } from '@/core/domain/entities/totem-event-subscription.entity';

interface LinkTotemToEventInput {
  locationName: string;
  totemOrganizationSubscriptionId: string;
  eventId: string;
  startsAt: Date;
  endsAt: Date;
}

export class LinkTotemToEventUseCase {
  constructor(
    private readonly totemEventSubRepository: ITotemEventSubscriptionRepository,
    private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository,
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(input: LinkTotemToEventInput): Promise<TotemEventSubscriptionEntity> {
    const orgSub = await this.totemOrgSubRepository.findById(input.totemOrganizationSubscriptionId);
    if (!orgSub) {
      throw new LinkTotemToEventError('Totem-organization subscription not found.');
    }

    const event = await this.eventRepository.findById(input.eventId);
    if (!event) {
      throw new LinkTotemToEventError('Event not found.');
    }

    return this.totemEventSubRepository.create({
      locationName: input.locationName,
      totemOrganizationSubscriptionId: input.totemOrganizationSubscriptionId,
      eventId: input.eventId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  }
}

export class LinkTotemToEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinkTotemToEventError';
  }
}
