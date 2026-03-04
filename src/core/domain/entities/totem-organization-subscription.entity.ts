import { BaseEntity } from './base.entity';

export interface TotemOrganizationSubscriptionProps {
  id: string;
  totemId: string;
  organizationId: string;
  startsAt: Date;
  endsAt: Date;
}

export class TotemOrganizationSubscriptionEntity extends BaseEntity {
  private constructor(private readonly props: TotemOrganizationSubscriptionProps) {
    super(props.id);
  }

  static create(props: TotemOrganizationSubscriptionProps): TotemOrganizationSubscriptionEntity {
    if (props.endsAt <= props.startsAt) {
      throw new Error('Subscription end date must be after start date');
    }
    return new TotemOrganizationSubscriptionEntity(props);
  }

  get totemId(): string {
    return this.props.totemId;
  }

  get organizationId(): string {
    return this.props.organizationId;
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

  coversDate(date: Date): boolean {
    return date >= this.props.startsAt && date <= this.props.endsAt;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  belongsToTotem(totemId: string): boolean {
    return this.props.totemId === totemId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      totemId: this.props.totemId,
      organizationId: this.props.organizationId,
      startsAt: this.props.startsAt,
      endsAt: this.props.endsAt,
    };
  }
}
