import type { CreatePrintConfigData, IPrintConfigRepository, UpdatePrintConfigData } from '@/core/domain/contracts';
import { PrintConfigEntity, type PrintOrientation, type QrCodeContentType } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPrintConfigRepository implements IPrintConfigRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PrintConfigEntity | null> {
    const config = await this.db.printConfig.findUnique({
      where: { id },
    });

    if (!config) return null;

    return PrintConfigEntity.create({
      id: config.id,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      orientation: config.orientation as PrintOrientation,
      printerDpi: config.printerDpi,
      copies: config.copies,
      qrCodeContent: (config.qrCodeContent as QrCodeContentType) || 'qr_code_value',
      showQrCode: config.showQrCode,
      showAccessCode: config.showAccessCode,
      fontSizeName: config.fontSizeName,
      fontSizeMeta: config.fontSizeMeta,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  }

  async create(data: CreatePrintConfigData): Promise<PrintConfigEntity> {
    const config = await this.db.printConfig.create({
      data: {
        paperWidth: data.paperWidth,
        paperHeight: data.paperHeight,
        orientation: data.orientation,
        printerDpi: data.printerDpi,
        copies: data.copies,
        qrCodeContent: data.qrCodeContent,
        showQrCode: data.showQrCode,
        showAccessCode: data.showAccessCode,
        fontSizeName: data.fontSizeName,
        fontSizeMeta: data.fontSizeMeta,
      },
    });

    return PrintConfigEntity.create({
      id: config.id,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      orientation: config.orientation as PrintOrientation,
      printerDpi: config.printerDpi,
      copies: config.copies,
      qrCodeContent: (config.qrCodeContent as QrCodeContentType) || 'qr_code_value',
      showQrCode: config.showQrCode,
      showAccessCode: config.showAccessCode,
      fontSizeName: config.fontSizeName,
      fontSizeMeta: config.fontSizeMeta,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  }

  async update(id: string, data: UpdatePrintConfigData): Promise<PrintConfigEntity> {
    const config = await this.db.printConfig.update({
      where: { id },
      data: {
        paperWidth: data.paperWidth,
        paperHeight: data.paperHeight,
        orientation: data.orientation,
        printerDpi: data.printerDpi,
        copies: data.copies,
        qrCodeContent: data.qrCodeContent,
        showQrCode: data.showQrCode,
        showAccessCode: data.showAccessCode,
        fontSizeName: data.fontSizeName,
        fontSizeMeta: data.fontSizeMeta,
      },
    });

    return PrintConfigEntity.create({
      id: config.id,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      orientation: config.orientation as PrintOrientation,
      printerDpi: config.printerDpi,
      copies: config.copies,
      qrCodeContent: (config.qrCodeContent as QrCodeContentType) || 'qr_code_value',
      showQrCode: config.showQrCode,
      showAccessCode: config.showAccessCode,
      fontSizeName: config.fontSizeName,
      fontSizeMeta: config.fontSizeMeta,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  }
}
