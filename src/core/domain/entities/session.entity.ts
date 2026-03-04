import { BaseEntity } from './base.entity';

export interface SessionProps {
  id: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export class SessionEntity extends BaseEntity {
  private constructor(private readonly props: SessionProps) {
    super(props.id);
  }

  static create(props: SessionProps): SessionEntity {
    return new SessionEntity(props);
  }

  get deviceId(): string {
    return this.props.deviceId;
  }

  get ipAddress(): string {
    return this.props.ipAddress;
  }

  get userAgent(): string {
    return this.props.userAgent;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get userId(): string {
    return this.props.userId;
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

  belongsToUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      deviceId: this.props.deviceId,
      ipAddress: this.props.ipAddress,
      userAgent: this.props.userAgent,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
      expiresAt: this.props.expiresAt,
    };
  }
}
