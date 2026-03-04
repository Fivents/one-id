import { BaseEntity } from './base.entity';

export interface SubscriptionProps {
  id: string;
  organizationId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

export class SubscriptionEntity extends BaseEntity {
  private constructor(private readonly props: SubscriptionProps) {
    super(props.id);
  }

  static create(props: SubscriptionProps): SubscriptionEntity {
    if (props.expiresAt <= props.startedAt) {
      throw new Error('Subscription expiration must be after start date');
    }
    return new SubscriptionEntity(props);
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get planId(): string {
    return this.props.planId;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isActive(now: Date = new Date()): boolean {
    return now >= this.props.startedAt && now <= this.props.expiresAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now > this.props.expiresAt;
  }

  daysUntilExpiration(now: Date = new Date()): number {
    const diff = this.props.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isExpiringSoon(thresholdDays: number = 30, now: Date = new Date()): boolean {
    return this.isActive(now) && this.daysUntilExpiration(now) <= thresholdDays;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  isForPlan(planId: string): boolean {
    return this.props.planId === planId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      organizationId: this.props.organizationId,
      planId: this.props.planId,
      startedAt: this.props.startedAt,
      expiresAt: this.props.expiresAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
