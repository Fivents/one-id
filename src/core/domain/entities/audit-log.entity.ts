import { BaseEntity } from './base.entity';

export type AuditAction =
  | 'CHECK_IN'
  | 'CHECK_IN_APPROVED'
  | 'CHECK_IN_DENIED'
  | 'TOTEM_AUTH'
  | 'TOTEM_AUTH_SUCCESS'
  | 'TOTEM_AUTH_FAILED'
  | 'PARTICIPANT_CREATED'
  | 'PARTICIPANT_UPDATED'
  | 'PARTICIPANT_DELETED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'FACE_REGISTERED'
  | 'FACE_UPDATED'
  | 'FACE_DELETED'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'PRINT_CONFIG_CREATED'
  | 'PRINT_CONFIG_UPDATED'
  | 'TOTEM_CREATED'
  | 'TOTEM_UPDATED'
  | 'TOTEM_DELETED'
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'PLAN_DELETED'
  | 'PLAN_CHANGE_REQUESTED'
  | 'PLAN_CHANGE_APPROVED'
  | 'PLAN_CHANGE_REJECTED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_PASSWORD_RESET'
  | 'ORG_CREATED'
  | 'ORG_UPDATED'
  | 'ORG_DELETED'
  | 'ORG_ACTIVATED'
  | 'ORG_DEACTIVATED'
  | 'TOTEM_LINKED'
  | 'TOTEM_UNLINKED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED';

export interface AuditLogProps {
  id: string;
  action: AuditAction;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  sessionId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  eventId?: string | null;
  createdAt: Date;
}

export class AuditLogEntity extends BaseEntity {
  private constructor(private readonly props: AuditLogProps) {
    super(props.id);
  }

  static create(props: AuditLogProps): AuditLogEntity {
    return new AuditLogEntity(props);
  }

  get action(): AuditAction {
    return this.props.action;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.props.metadata;
  }

  get sessionId(): string | null | undefined {
    return this.props.sessionId;
  }

  get organizationId(): string | null | undefined {
    return this.props.organizationId;
  }

  get userId(): string | null | undefined {
    return this.props.userId;
  }

  get eventId(): string | null | undefined {
    return this.props.eventId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isSystemAction(): boolean {
    return !this.props.userId;
  }

  hasMetadata(): boolean {
    return this.props.metadata != null;
  }

  isRelatedToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  isRelatedToEvent(eventId: string): boolean {
    return this.props.eventId === eventId;
  }

  isPerformedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      action: this.props.action,
      description: this.props.description,
      metadata: this.props.metadata,
      sessionId: this.props.sessionId,
      organizationId: this.props.organizationId,
      userId: this.props.userId,
      eventId: this.props.eventId,
      createdAt: this.props.createdAt,
    };
  }
}
