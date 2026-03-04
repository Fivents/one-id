import { BaseEntity } from './base.entity';

export type NotificationType =
  | 'PLAN_REQUEST'
  | 'PLAN_APPROVED'
  | 'PLAN_REJECTED'
  | 'LIMIT_WARNING'
  | 'EXPIRATION_WARNING'
  | 'NEW_MEMBER'
  | 'EVENT_CREATED'
  | 'SYSTEM_MESSAGE';

export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS';

export interface NotificationProps {
  id: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  userId: string;
  createdAt: Date;
  readAt?: Date | null;
  deletedAt?: Date | null;
}

export class NotificationEntity extends BaseEntity {
  private constructor(private readonly props: NotificationProps) {
    super(props.id);
  }

  static create(props: NotificationProps): NotificationEntity {
    return new NotificationEntity(props);
  }

  get channel(): NotificationChannel {
    return this.props.channel;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get data(): Record<string, unknown> | null | undefined {
    return this.props.data;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get readAt(): Date | null | undefined {
    return this.props.readAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  isRead(): boolean {
    return !!this.props.readAt;
  }

  isUnread(): boolean {
    return !this.props.readAt;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  isEmail(): boolean {
    return this.props.channel === 'EMAIL';
  }

  isInApp(): boolean {
    return this.props.channel === 'IN_APP';
  }

  isSms(): boolean {
    return this.props.channel === 'SMS';
  }

  isSystemMessage(): boolean {
    return this.props.type === 'SYSTEM_MESSAGE';
  }

  isWarning(): boolean {
    return this.props.type === 'LIMIT_WARNING' || this.props.type === 'EXPIRATION_WARNING';
  }

  belongsToUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  hasData(): boolean {
    return this.props.data != null;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      channel: this.props.channel,
      type: this.props.type,
      title: this.props.title,
      message: this.props.message,
      data: this.props.data,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
      readAt: this.props.readAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
