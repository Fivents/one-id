export interface AuthIdentityProps {
  id: string;
  provider: string;
  providerId: string;
  passwordHash?: string | null;
  allowAccess: boolean;
  userId: string;
}

export class AuthIdentityEntity {
  private constructor(private readonly props: AuthIdentityProps) {}

  static create(props: AuthIdentityProps): AuthIdentityEntity {
    return new AuthIdentityEntity(props);
  }

  get id(): string {
    return this.props.id;
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

  isPasswordConfigured(): boolean {
    return !!this.props.passwordHash;
  }

  isAccessAllowed(): boolean {
    return this.props.allowAccess;
  }
}
