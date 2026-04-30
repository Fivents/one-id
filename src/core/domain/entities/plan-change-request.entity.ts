import { BaseEntity } from './base.entity';

export type PlanRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PlanChangeRequestProps {
  id: string;
  message: string;
  status: PlanRequestStatus;
  organizationId: string;
  currentPlanId: string;
  requestedPlanId: string;
  resolvedAt?: Date | null;
  resolvedById?: string | null;
  resolvedNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PlanChangeRequestEntity extends BaseEntity {
  private constructor(private readonly props: PlanChangeRequestProps) {
    super(props.id);
  }

  static create(props: PlanChangeRequestProps): PlanChangeRequestEntity {
    return new PlanChangeRequestEntity(props);
  }

  get message(): string {
    return this.props.message;
  }

  get status(): PlanRequestStatus {
    return this.props.status;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get currentPlanId(): string {
    return this.props.currentPlanId;
  }

  get requestedPlanId(): string {
    return this.props.requestedPlanId;
  }

  get resolvedAt(): Date | null | undefined {
    return this.props.resolvedAt;
  }

  get resolvedById(): string | null | undefined {
    return this.props.resolvedById;
  }

  get resolvedNote(): string | null | undefined {
    return this.props.resolvedNote;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isApproved(): boolean {
    return this.props.status === 'APPROVED';
  }

  isRejected(): boolean {
    return this.props.status === 'REJECTED';
  }

  canResolve(): boolean {
    return this.isPending();
  }

  wasResolvedBy(userId: string): boolean {
    return this.props.resolvedById === userId;
  }

  isRequestingDifferentPlan(): boolean {
    return this.props.currentPlanId !== this.props.requestedPlanId;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      message: this.props.message,
      status: this.props.status,
      organizationId: this.props.organizationId,
      currentPlanId: this.props.currentPlanId,
      requestedPlanId: this.props.requestedPlanId,
      resolvedAt: this.props.resolvedAt,
      resolvedById: this.props.resolvedById,
      resolvedNote: this.props.resolvedNote,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
