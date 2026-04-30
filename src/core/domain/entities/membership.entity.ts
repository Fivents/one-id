import type { Role } from '../value-objects/role';

import { BaseEntity } from './base.entity';

export interface MembershipProps {
  id: string;
  role: Role;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class MembershipEntity extends BaseEntity {
  private constructor(private readonly props: MembershipProps) {
    super(props.id);
  }

  static create(props: MembershipProps): MembershipEntity {
    return new MembershipEntity(props);
  }

  get role(): Role {
    return this.props.role;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string {
    return this.props.organizationId;
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

  isOwner(): boolean {
    return this.props.role === 'ORG_OWNER';
  }

  isManager(): boolean {
    return this.props.role === 'EVENT_MANAGER';
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  belongsToUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      role: this.props.role,
      userId: this.props.userId,
      organizationId: this.props.organizationId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
