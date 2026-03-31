import { BaseEntity } from './base.entity';

export type DocumentType = 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER';

export interface PersonProps {
  id: string;
  name: string;
  email: string;
  document?: string | null;
  documentType?: DocumentType | null;
  phone?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PersonEntity extends BaseEntity {
  private constructor(private readonly props: PersonProps) {
    super(props.id);
  }

  static create(props: PersonProps): PersonEntity {
    return new PersonEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get document(): string | null | undefined {
    return this.props.document;
  }

  get documentType(): DocumentType | null | undefined {
    return this.props.documentType;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get qrCodeValue(): string | null | undefined {
    return this.props.qrCodeValue;
  }

  get accessCode(): string | null | undefined {
    return this.props.accessCode;
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

  get emailDomain(): string {
    return this.props.email.split('@')[1] ?? '';
  }

  hasDocument(): boolean {
    return !!this.props.document;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      email: this.props.email,
      document: this.props.document,
      documentType: this.props.documentType,
      phone: this.props.phone,
      qrCodeValue: this.props.qrCodeValue,
      accessCode: this.props.accessCode,
      organizationId: this.props.organizationId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
