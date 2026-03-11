import { BaseEntity } from './base.entity';

export type TotemStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface TotemProps {
  id: string;
  name: string;
  accessCode: string | null;
  status: TotemStatus;
  price: number;
  discount: number;
  lastHeartbeat?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class TotemEntity extends BaseEntity {
  private constructor(private readonly props: TotemProps) {
    super(props.id);
  }

  static create(props: TotemProps): TotemEntity {
    return new TotemEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get accessCode(): string | null {
    return this.props.accessCode;
  }

  hasAccessCode(): boolean {
    return !!this.props.accessCode;
  }

  get status(): TotemStatus {
    return this.props.status;
  }

  get price(): number {
    return this.props.price;
  }

  get discount(): number {
    return this.props.discount;
  }

  get lastHeartbeat(): Date | null | undefined {
    return this.props.lastHeartbeat;
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

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isInactive(): boolean {
    return this.props.status === 'INACTIVE';
  }

  isInMaintenance(): boolean {
    return this.props.status === 'MAINTENANCE';
  }

  canAuthenticate(): boolean {
    return this.hasAccessCode() && !this.isInMaintenance() && !this.isDeleted();
  }

  isOnline(now: Date = new Date(), thresholdMs: number = HEARTBEAT_TIMEOUT_MS): boolean {
    if (!this.props.lastHeartbeat) return false;
    return now.getTime() - this.props.lastHeartbeat.getTime() <= thresholdMs;
  }

  effectivePrice(): number {
    return Math.max(0, this.props.price - this.props.discount);
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      accessCode: this.props.accessCode,
      status: this.props.status,
      price: this.props.price,
      discount: this.props.discount,
      lastHeartbeat: this.props.lastHeartbeat,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
