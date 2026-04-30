import { BaseEntity } from './base.entity';

export interface AuthIdentityProps {
  id: string;
  provider: string;
  providerId: string;
  passwordHash?: string | null;
  allowAccess: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class AuthIdentityEntity extends BaseEntity {
  private constructor(private readonly props: AuthIdentityProps) {
    super(props.id);
  }

  static create(props: AuthIdentityProps): AuthIdentityEntity {
    return new AuthIdentityEntity(props);
  }

  get provider(): string {
    return this.props.provider;
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get passwordHash(): string | null | undefined {
    return this.props.passwordHash;
  }

  get allowAccess(): boolean {
    return this.props.allowAccess;
  }

  get userId(): string {
    return this.props.userId;
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

  isPasswordConfigured(): boolean {
    return !!this.props.passwordHash;
  }

  isAccessAllowed(): boolean {
    return this.props.allowAccess;
  }

  isCredentialProvider(): boolean {
    return this.props.provider === 'credentials';
  }

  isOAuthProvider(): boolean {
    return this.props.provider !== 'credentials';
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      provider: this.props.provider,
      providerId: this.props.providerId,
      allowAccess: this.props.allowAccess,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
