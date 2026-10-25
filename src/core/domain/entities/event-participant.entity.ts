import { BaseEntity } from './base.entity';
import type { CodeProvenance } from './organization-people-settings.entity';
import type { DocumentType } from './person.entity';

export interface EventParticipantProps {
  id: string;
  company?: string | null;
  jobTitle?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  useDocumentAsAccessCode: boolean;
  accessCodeProvenance: CodeProvenance;
  qrCodeProvenance: CodeProvenance;
  attendeeFullName?: string | null;
  attendeeEmail?: string | null;
  attendeeDocument?: string | null;
  attendeeDocumentType?: DocumentType | null;
  /** Null when the ticket has no identity attached yet — see the attendee snapshot above. */
  personId?: string | null;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class EventParticipantEntity extends BaseEntity {
  private constructor(private readonly props: EventParticipantProps) {
    super(props.id);
  }

  static create(props: EventParticipantProps): EventParticipantEntity {
    return new EventParticipantEntity(props);
  }

  get company(): string | null | undefined {
    return this.props.company;
  }

  get jobTitle(): string | null | undefined {
    return this.props.jobTitle;
  }

  get qrCodeValue(): string | null | undefined {
    return this.props.qrCodeValue;
  }

  get accessCode(): string | null | undefined {
    return this.props.accessCode;
  }

  get useDocumentAsAccessCode(): boolean {
    return this.props.useDocumentAsAccessCode;
  }

  get accessCodeProvenance(): CodeProvenance {
    return this.props.accessCodeProvenance;
  }

  get qrCodeProvenance(): CodeProvenance {
    return this.props.qrCodeProvenance;
  }

  get attendeeFullName(): string | null | undefined {
    return this.props.attendeeFullName;
  }

  get attendeeEmail(): string | null | undefined {
    return this.props.attendeeEmail;
  }

  get attendeeDocument(): string | null | undefined {
    return this.props.attendeeDocument;
  }

  get attendeeDocumentType(): DocumentType | null | undefined {
    return this.props.attendeeDocumentType;
  }

  get personId(): string | null | undefined {
    return this.props.personId;
  }

  get eventId(): string {
    return this.props.eventId;
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

  hasCompanyInfo(): boolean {
    return !!this.props.company;
  }

  isForEvent(eventId: string): boolean {
    return this.props.eventId === eventId;
  }

  isForPerson(personId: string): boolean {
    return this.props.personId === personId;
  }

  hasIdentity(): boolean {
    return !!this.props.personId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      company: this.props.company,
      jobTitle: this.props.jobTitle,
      qrCodeValue: this.props.qrCodeValue,
      accessCode: this.props.accessCode,
      useDocumentAsAccessCode: this.props.useDocumentAsAccessCode,
      accessCodeProvenance: this.props.accessCodeProvenance,
      qrCodeProvenance: this.props.qrCodeProvenance,
      attendeeFullName: this.props.attendeeFullName,
      attendeeEmail: this.props.attendeeEmail,
      attendeeDocument: this.props.attendeeDocument,
      attendeeDocumentType: this.props.attendeeDocumentType,
      personId: this.props.personId,
      eventId: this.props.eventId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
