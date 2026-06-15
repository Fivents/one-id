import { BaseEntity } from './base.entity';

export type PrintJobStatus = 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PrintJobProps {
  id: string;
  status: PrintJobStatus;
  copies: number;
  errorMessage: string | null;
  printedAt: Date | null;
  tokenHash: string | null;
  eventId: string;
  eventParticipantId: string;
  checkInId: string | null;
  totemId: string | null;
  printConfigId: string;
  initiatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrintJobData {
  eventId: string;
  eventParticipantId: string;
  checkInId?: string | null;
  totemId?: string | null;
  printConfigId: string;
  initiatedById?: string | null;
  copies?: number;
}

export class PrintJobEntity extends BaseEntity {
  private constructor(private readonly props: PrintJobProps) {
    super(props.id);
  }

  static create(props: PrintJobProps): PrintJobEntity {
    return new PrintJobEntity(props);
  }

  get status(): PrintJobStatus {
    return this.props.status;
  }

  get copies(): number {
    return this.props.copies;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get printedAt(): Date | null {
    return this.props.printedAt;
  }

  get tokenHash(): string | null {
    return this.props.tokenHash;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get eventParticipantId(): string {
    return this.props.eventParticipantId;
  }

  get checkInId(): string | null {
    return this.props.checkInId;
  }

  get totemId(): string | null {
    return this.props.totemId;
  }

  get printConfigId(): string {
    return this.props.printConfigId;
  }

  get initiatedById(): string | null {
    return this.props.initiatedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  complete(): void {
    this.props.status = 'COMPLETED';
    this.props.printedAt = new Date();
  }

  fail(errorMessage: string): void {
    this.props.status = 'FAILED';
    this.props.errorMessage = errorMessage;
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
  }

  setTokenHash(hash: string): void {
    this.props.tokenHash = hash;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
