import crypto from 'node:crypto';

import * as jose from 'jose';

import type { IPrintJobRepository } from '@/core/domain/contracts/print-job.repository';
import type { PrintConfigEntity } from '@/core/domain/entities';
import type { CreatePrintJobData, PrintJobEntity } from '@/core/domain/entities/print-job.entity';
import { env } from '@/core/infrastructure/environment/env';

import { LabelGeneratorService, type LabelConfig, type LabelData } from './label-generator.service';

export interface PrintJobResult {
  job: PrintJobEntity;
  html: string;
  token: string;
}

interface PrintTokenPayload {
  jobId: string;
  eventParticipantId: string;
  exp: number;
  iat: number;
}

export class PrintJobService {
  private readonly labelGenerator: LabelGeneratorService;
  private readonly jwtSecret: Uint8Array;

  constructor(private readonly printJobRepository: IPrintJobRepository) {
    this.labelGenerator = new LabelGeneratorService();
    this.jwtSecret = new TextEncoder().encode(env.JWT_SECRET);
  }

  async createPrintJob(data: CreatePrintJobData): Promise<PrintJobEntity> {
    return this.printJobRepository.create(data);
  }

  async generateBadgeHtml(
    participant: { id?: string; name: string; company: string | null; jobTitle: string | null; accessCode: string | null; qrCodeValue: string | null },
    event: { name: string },
    printConfig: PrintConfigEntity,
  ): Promise<string> {
    const qrContent = this.getQrCodeContent(printConfig, participant);
    const accessCodeDisplay = participant.accessCode || participant.qrCodeValue || '—';

    const labelData: LabelData = {
      eventName: event.name,
      participantName: participant.name,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrContent,
      accessCodeDisplay,
      showQrCode: printConfig.showQrCode,
      showAccessCode: printConfig.showAccessCode,
    };

    const labelConfig: LabelConfig = {
      paperWidth: printConfig.paperWidth,
      paperHeight: printConfig.paperHeight,
      orientation: printConfig.orientation,
      printerDpi: printConfig.printerDpi,
      fontSizeName: printConfig.fontSizeName,
      fontSizeMeta: printConfig.fontSizeMeta,
    };

    return this.labelGenerator.generateBadgeHtml(labelData, labelConfig);
  }

  async executePrint(
    data: CreatePrintJobData,
    participant: { id?: string; name: string; company: string | null; jobTitle: string | null; accessCode: string | null; qrCodeValue: string | null },
    event: { name: string },
    printConfig: PrintConfigEntity,
  ): Promise<PrintJobResult> {
    const job = await this.printJobRepository.create(data);

    const html = await this.generateBadgeHtml(participant, event, printConfig);

    const token = await this.generatePrintToken(job.id, job.eventParticipantId);

    await this.printJobRepository.update(job.id, {
      status: 'COMPLETED',
      printedAt: new Date(),
      tokenHash: this.hashToken(token),
    });

    const updated = (await this.printJobRepository.findById(job.id))!;

    return { job: updated, html, token };
  }

  async getJobById(id: string): Promise<PrintJobEntity | null> {
    return this.printJobRepository.findById(id);
  }

  async getHistoryByEventId(eventId: string, page = 1, pageSize = 50): Promise<{ jobs: PrintJobEntity[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [jobs, total] = await Promise.all([
      this.printJobRepository.findByEventId(eventId, pageSize, offset),
      this.printJobRepository.countByEventId(eventId),
    ]);
    return { jobs, total };
  }

  async verifyPrintToken(token: string): Promise<{ jobId: string; eventParticipantId: string } | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwtSecret, {
        issuer: 'oneid',
        audience: 'print-label',
      });
      return payload as unknown as { jobId: string; eventParticipantId: string };
    } catch {
      return null;
    }
  }

  private async generatePrintToken(jobId: string, eventParticipantId: string): Promise<string> {
    return new jose.SignJWT({ jobId, eventParticipantId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('oneid')
      .setAudience('print-label')
      .setExpirationTime('5m')
      .sign(this.jwtSecret);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getQrCodeContent(
    config: PrintConfigEntity,
    participant: { id?: string; accessCode: string | null; qrCodeValue: string | null },
  ): string {
    switch (config.qrCodeContent) {
      case 'participant_id':
        return participant.id || participant.accessCode || participant.qrCodeValue || 'unknown';
      case 'access_code':
        return participant.accessCode || participant.qrCodeValue || 'unknown';
      case 'qr_code_value':
      default:
        return participant.qrCodeValue || participant.accessCode || 'unknown';
    }
  }
}
