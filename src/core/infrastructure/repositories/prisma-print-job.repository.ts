import type { IPrintJobRepository, UpdatePrintJobData } from '@/core/domain/contracts/print-job.repository';
import type { CreatePrintJobData } from '@/core/domain/entities/print-job.entity';
import { PrintJobEntity, type PrintJobStatus } from '@/core/domain/entities/print-job.entity';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPrintJobRepository implements IPrintJobRepository {
  private readonly printJob: PrismaClient['printJob'];

  constructor(private readonly db: PrismaClient) {
    this.printJob = db.printJob;
  }

  async findById(id: string): Promise<PrintJobEntity | null> {
    const job = await this.printJob.findUnique({ where: { id } });
    if (!job) return null;
    return this.toEntity(job);
  }

  async findByEventId(eventId: string, limit = 50, offset = 0): Promise<PrintJobEntity[]> {
    const jobs = await this.printJob.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return jobs.map((j) => this.toEntity(j));
  }

  async findByParticipantId(eventParticipantId: string): Promise<PrintJobEntity[]> {
    const jobs = await this.printJob.findMany({
      where: { eventParticipantId },
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map((j) => this.toEntity(j));
  }

  async create(data: CreatePrintJobData): Promise<PrintJobEntity> {
    const job = await this.printJob.create({
      data: {
        eventId: data.eventId,
        eventParticipantId: data.eventParticipantId,
        checkInId: data.checkInId ?? null,
        totemId: data.totemId ?? null,
        printConfigId: data.printConfigId,
        initiatedById: data.initiatedById ?? null,
        copies: data.copies ?? 1,
      },
    });
    return this.toEntity(job);
  }

  async update(id: string, data: UpdatePrintJobData): Promise<PrintJobEntity> {
    const job = await this.printJob.update({
      where: { id },
      data: {
        status: data.status as PrintJobStatus | undefined,
        errorMessage: data.errorMessage,
        printedAt: data.printedAt,
        tokenHash: data.tokenHash,
      },
    });
    return this.toEntity(job);
  }

  async countByEventId(eventId: string): Promise<number> {
    return this.printJob.count({ where: { eventId } });
  }

  private toEntity(data: {
    id: string;
    status: string;
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
  }): PrintJobEntity {
    return PrintJobEntity.create({
      id: data.id,
      status: data.status as PrintJobStatus,
      copies: data.copies,
      errorMessage: data.errorMessage,
      printedAt: data.printedAt,
      tokenHash: data.tokenHash,
      eventId: data.eventId,
      eventParticipantId: data.eventParticipantId,
      checkInId: data.checkInId,
      totemId: data.totemId,
      printConfigId: data.printConfigId,
      initiatedById: data.initiatedById,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
