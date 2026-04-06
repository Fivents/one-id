import { AppError, ErrorCode } from '@/core/errors';

import type { EventAddress } from '../value-objects';

import { BaseEntity } from './base.entity';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';

export interface EventProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  timezone: string;
  address?: string | null;
  addressDetails?: EventAddress | null;
  status: EventStatus;
  faceEnabled: boolean;
  qrEnabled: boolean;
  codeEnabled: boolean;
  startsAt: Date;
  endsAt: Date;
  organizationId: string;
  printConfigId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const EVENT_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELED'],
  PUBLISHED: ['ACTIVE', 'CANCELED'],
  ACTIVE: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

export class EventEntity extends BaseEntity {
  private constructor(private readonly props: EventProps) {
    super(props.id);
  }

  static create(props: EventProps): EventEntity {
    if (props.endsAt <= props.startsAt) {
      throw new AppError({
        code: ErrorCode.ENTITY_INVARIANT_VIOLATION,
        message: 'Event end date must be after start date',
        httpStatus: 400,
        level: 'error',
      });
    }

    if (!props.faceEnabled && !props.qrEnabled && !props.codeEnabled) {
      throw new AppError({
        code: ErrorCode.ENTITY_INVARIANT_VIOLATION,
        message: 'Event must have at least one check-in method enabled',
        httpStatus: 400,
        level: 'error',
      });
    }

    return new EventEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get address(): string | null | undefined {
    return this.props.address;
  }

  get addressDetails(): EventAddress | null | undefined {
    return this.props.addressDetails;
  }

  get status(): EventStatus {
    return this.props.status;
  }

  get faceEnabled(): boolean {
    return this.props.faceEnabled;
  }

  get qrEnabled(): boolean {
    return this.props.qrEnabled;
  }

  get codeEnabled(): boolean {
    return this.props.codeEnabled;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get printConfigId(): string | null | undefined {
    return this.props.printConfigId;
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

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isPublished(): boolean {
    return this.props.status === 'PUBLISHED';
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  isCanceled(): boolean {
    return this.props.status === 'CANCELED';
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  canTransitionTo(target: EventStatus): boolean {
    return EVENT_TRANSITIONS[this.props.status].includes(target);
  }

  isOngoing(now: Date = new Date()): boolean {
    return this.isActive() && now >= this.props.startsAt && now <= this.props.endsAt;
  }

  hasStarted(now: Date = new Date()): boolean {
    return now >= this.props.startsAt;
  }

  hasEnded(now: Date = new Date()): boolean {
    return now >= this.props.endsAt;
  }

  isWithinPeriod(date: Date): boolean {
    return date >= this.props.startsAt && date <= this.props.endsAt;
  }

  hasPrintConfig(): boolean {
    return !!this.props.printConfigId;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      timezone: this.props.timezone,
      address: this.props.address ?? null,
      addressDetails: this.props.addressDetails ?? null,
      status: this.props.status,
      faceEnabled: this.props.faceEnabled,
      qrEnabled: this.props.qrEnabled,
      codeEnabled: this.props.codeEnabled,
      startsAt: this.props.startsAt,
      endsAt: this.props.endsAt,
      organizationId: this.props.organizationId,
      printConfigId: this.props.printConfigId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
