import { randomUUID } from 'node:crypto';

import { BaseEntity } from './base.entity';

export type CodeSourceField = 'NONE' | 'DOCUMENT' | 'PHONE' | 'EMAIL';
export type CodeProvenance = 'MANUAL' | 'RANDOM' | 'DERIVED';

export interface OrganizationPeopleSettingsProps {
  id: string;
  organizationId: string;
  accessCodeSource: CodeSourceField;
  qrCodeSource: CodeSourceField;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationPeopleSettingsEntity extends BaseEntity {
  private constructor(private readonly props: OrganizationPeopleSettingsProps) {
    super(props.id);
  }

  static create(props: OrganizationPeopleSettingsProps): OrganizationPeopleSettingsEntity {
    return new OrganizationPeopleSettingsEntity(props);
  }

  static default(organizationId: string): OrganizationPeopleSettingsEntity {
    const now = new Date();
    return new OrganizationPeopleSettingsEntity({
      id: randomUUID(),
      organizationId,
      accessCodeSource: 'NONE',
      qrCodeSource: 'NONE',
      createdAt: now,
      updatedAt: now,
    });
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get accessCodeSource(): CodeSourceField {
    return this.props.accessCodeSource;
  }

  get qrCodeSource(): CodeSourceField {
    return this.props.qrCodeSource;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
