import type { Role } from '../value-objects/role';

import { BaseEntity } from './base.entity';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UserWithMembership extends UserProps {
  role: Role;
  organizationId: string;
}

export class UserEntity extends BaseEntity {
  private constructor(private readonly props: UserProps) {
    super(props.id);
  }

  static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
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

  get domain(): string {
    return this.props.email.split('@')[1] ?? '';
  }

  isFromDomain(domain: string): boolean {
    return this.domain.toLowerCase() === domain.toLowerCase();
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      email: this.props.email,
      avatarUrl: this.props.avatarUrl,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
