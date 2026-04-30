import { BaseEntity } from './base.entity';

export interface OrganizationProps {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class OrganizationEntity extends BaseEntity {
  private constructor(private readonly props: OrganizationProps) {
    super(props.id);
  }

  static create(props: OrganizationProps): OrganizationEntity {
    return new OrganizationEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get email(): string | null | undefined {
    return this.props.email;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  canOperate(): boolean {
    return this.props.isActive && !this.isDeleted();
  }

  hasContactInfo(): boolean {
    return !!this.props.email || !!this.props.phone;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      slug: this.props.slug,
      email: this.props.email,
      phone: this.props.phone,
      logoUrl: this.props.logoUrl,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
