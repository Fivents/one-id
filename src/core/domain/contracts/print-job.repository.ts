import type { CreatePrintJobData, PrintJobEntity } from '../entities/print-job.entity';

export type UpdatePrintJobData = Partial<{
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage: string | null;
  printedAt: Date | null;
  tokenHash: string | null;
}>;

export interface IPrintJobRepository {
  findById(id: string): Promise<PrintJobEntity | null>;
  findByEventId(eventId: string, limit?: number, offset?: number): Promise<PrintJobEntity[]>;
  findByParticipantId(eventParticipantId: string): Promise<PrintJobEntity[]>;
  create(data: CreatePrintJobData): Promise<PrintJobEntity>;
  update(id: string, data: UpdatePrintJobData): Promise<PrintJobEntity>;
  countByEventId(eventId: string): Promise<number>;
}
