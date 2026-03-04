import { BaseEntity } from './base.entity';

export interface EventParticipantProps {
  id: string;
  company?: string | null;
  jobTitle?: string | null;
  personId: string;
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

  get personId(): string {
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

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      company: this.props.company,
      jobTitle: this.props.jobTitle,
      personId: this.props.personId,
      eventId: this.props.eventId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
