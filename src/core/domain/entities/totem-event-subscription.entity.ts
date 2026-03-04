import { BaseEntity } from './base.entity';

export interface TotemEventSubscriptionProps {
  id: string;
  locationName: string;
  totemOrganizationSubscriptionId: string;
  eventId: string;
  startsAt: Date;
  endsAt: Date;
}

export class TotemEventSubscriptionEntity extends BaseEntity {
  private constructor(private readonly props: TotemEventSubscriptionProps) {
    super(props.id);
  }

  static create(props: TotemEventSubscriptionProps): TotemEventSubscriptionEntity {
    if (props.endsAt <= props.startsAt) {
      throw new Error('Event subscription end date must be after start date');
    }
    return new TotemEventSubscriptionEntity(props);
  }

  get locationName(): string {
    return this.props.locationName;
  }

  get totemOrganizationSubscriptionId(): string {
    return this.props.totemOrganizationSubscriptionId;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  isActive(now: Date = new Date()): boolean {
    return now >= this.props.startsAt && now <= this.props.endsAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now > this.props.endsAt;
  }

  isForEvent(eventId: string): boolean {
    return this.props.eventId === eventId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      locationName: this.props.locationName,
      totemOrganizationSubscriptionId: this.props.totemOrganizationSubscriptionId,
      eventId: this.props.eventId,
      startsAt: this.props.startsAt,
      endsAt: this.props.endsAt,
    };
  }
}
