import { BaseEntity } from './base.entity';

export interface PlanFeatureProps {
  id: string;
  value: string;
  featureId: string;
  planId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PlanFeatureEntity extends BaseEntity {
  private constructor(private readonly props: PlanFeatureProps) {
    super(props.id);
  }

  static create(props: PlanFeatureProps): PlanFeatureEntity {
    return new PlanFeatureEntity(props);
  }

  get value(): string {
    return this.props.value;
  }

  get featureId(): string {
    return this.props.featureId;
  }

  get planId(): string {
    return this.props.planId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  booleanValue(): boolean {
    return this.props.value === 'true';
  }

  numberValue(): number {
    const parsed = Number(this.props.value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  isEnabled(): boolean {
    return this.booleanValue();
  }

  isForPlan(planId: string): boolean {
    return this.props.planId === planId;
  }

  isForFeature(featureId: string): boolean {
    return this.props.featureId === featureId;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      value: this.props.value,
      featureId: this.props.featureId,
      planId: this.props.planId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
