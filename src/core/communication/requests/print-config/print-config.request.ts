import { z } from 'zod/v4';

export const qrCodeContentOptions = ['participant_id', 'access_code', 'qr_code_value'] as const;
export type QrCodeContentOption = (typeof qrCodeContentOptions)[number];

export const createPrintConfigRequestSchema = z.object({
  paperWidth: z.number().positive().max(300),
  paperHeight: z.number().positive().max(500),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  printerDpi: z.number().int().min(72).max(1200),
  copies: z.number().int().min(1).max(10),
  qrCodeContent: z.enum(qrCodeContentOptions),
  showQrCode: z.boolean(),
  showAccessCode: z.boolean(),
  fontSizeName: z.number().int().min(8).max(24),
  fontSizeMeta: z.number().int().min(6).max(18),
});

export type CreatePrintConfigRequest = z.infer<typeof createPrintConfigRequestSchema>;

export const updatePrintConfigRequestSchema = createPrintConfigRequestSchema.partial();

export type UpdatePrintConfigRequest = z.infer<typeof updatePrintConfigRequestSchema>;

export interface PrintConfigResponse {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  printerDpi: number;
  copies: number;
  qrCodeContent: QrCodeContentOption;
  showQrCode: boolean;
  showAccessCode: boolean;
  fontSizeName: number;
  fontSizeMeta: number;
  createdAt: string;
  updatedAt: string;
}
