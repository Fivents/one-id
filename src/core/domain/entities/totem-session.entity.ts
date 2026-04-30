import { BaseEntity } from './base.entity';

export interface TotemSessionProps {
  id: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  totemId: string;
  createdAt: Date;
  expiresAt: Date;
}

export class TotemSessionEntity extends BaseEntity {
  private constructor(private readonly props: TotemSessionProps) {
    super(props.id);
  }

  static create(props: TotemSessionProps): TotemSessionEntity {
    return new TotemSessionEntity(props);
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get ipAddress(): string {
    return this.props.ipAddress;
  }

  get userAgent(): string {
    return this.props.userAgent;
  }

  get totemId(): string {
    return this.props.totemId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.props.expiresAt;
  }

  isValid(now: Date = new Date()): boolean {
    return !this.isExpired(now);
  }

  belongsToTotem(totemId: string): boolean {
    return this.props.totemId === totemId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      ipAddress: this.props.ipAddress,
      userAgent: this.props.userAgent,
      totemId: this.props.totemId,
      createdAt: this.props.createdAt,
      expiresAt: this.props.expiresAt,
    };
  }
}
