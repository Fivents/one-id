import { z } from 'zod/v4';

export const createPrintConfigRequestSchema = z.object({
  paperWidth: z.number().positive(),
  paperHeight: z.number().positive(),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  marginTop: z.number().min(0),
  marginRight: z.number().min(0),
  marginBottom: z.number().min(0),
  marginLeft: z.number().min(0),
  showFiventsLogo: z.boolean(),
  fiventsLogoPosition: z.string().min(1),
  fiventsLogoSize: z.number().positive(),
  showOrgLogo: z.boolean(),
  orgLogoPosition: z.string().min(1),
  orgLogoSize: z.number().positive(),
  showQrCode: z.boolean(),
  qrCodePosition: z.string().min(1),
  qrCodeSize: z.number().positive(),
  qrCodeContent: z.string().min(1),
  showName: z.boolean(),
  namePosition: z.string().min(1),
  nameFontSize: z.number().positive(),
  nameBold: z.boolean(),
  showCompany: z.boolean(),
  companyPosition: z.string().min(1),
  companyFontSize: z.number().positive(),
  showJobTitle: z.boolean(),
  jobTitlePosition: z.string().min(1),
  jobTitleFontSize: z.number().positive(),
  itemsOrder: z.string().min(1),
  printerDpi: z.number().positive(),
  printerType: z.string().min(1),
  printSpeed: z.number().positive(),
  copies: z.number().int().positive(),
  backgroundColor: z.string().min(1),
  textColor: z.string().min(1),
  fontFamily: z.string().min(1),
});

export type CreatePrintConfigRequest = z.infer<typeof createPrintConfigRequestSchema>;

export const updatePrintConfigRequestSchema = createPrintConfigRequestSchema.partial();

export type UpdatePrintConfigRequest = z.infer<typeof updatePrintConfigRequestSchema>;
