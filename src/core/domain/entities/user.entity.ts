import type { Role } from '../value-objects/role';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface UserWithMembership extends UserProps {
  role: Role;
  organizationId: string;
}

export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  get id(): string {
    return this.props.id;
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

  get domain(): string {
    return this.props.email.split('@')[1] ?? '';
  }

  isFromDomain(domain: string): boolean {
    return this.domain.toLowerCase() === domain.toLowerCase();
  }
}
