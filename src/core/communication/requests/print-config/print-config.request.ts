import { z } from 'zod/v4';

export const createPrintConfigRequestSchema = z.object({
  paperWidth: z.number().positive().max(300),
  paperHeight: z.number().positive().max(500),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  marginTop: z.number().min(0).max(50),
  marginRight: z.number().min(0).max(50),
  marginBottom: z.number().min(0).max(50),
  marginLeft: z.number().min(0).max(50),
  showFiventsLogo: z.boolean(),
  fiventsLogoPosition: z.enum(['top', 'bottom']),
  fiventsLogoSize: z.number().min(5).max(100),
  showOrgLogo: z.boolean(),
  orgLogoPosition: z.enum(['top', 'bottom']),
  orgLogoSize: z.number().min(5).max(100),
  showQrCode: z.boolean(),
  qrCodePosition: z.enum(['top', 'center', 'bottom']),
  qrCodeSize: z.number().min(10).max(100),
  qrCodeContent: z.enum(['participant_id', 'check_in_url', 'custom']),
  showName: z.boolean(),
  namePosition: z.enum(['top', 'center', 'bottom']),
  nameFontSize: z.number().min(8).max(32),
  nameBold: z.boolean(),
  showCompany: z.boolean(),
  companyPosition: z.enum(['top', 'center', 'bottom']),
  companyFontSize: z.number().min(6).max(24),
  showJobTitle: z.boolean(),
  jobTitlePosition: z.enum(['top', 'center', 'bottom']),
  jobTitleFontSize: z.number().min(6).max(24),
  itemsOrder: z.array(z.string()),
  printerDpi: z.number().int().min(72).max(1200),
  printerType: z.enum(['thermal', 'inkjet', 'laser']),
  printSpeed: z.number().int().min(1).max(5),
  copies: z.number().int().min(1).max(10),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  fontFamily: z.string().min(1).max(50),
});

export type CreatePrintConfigRequest = z.infer<typeof createPrintConfigRequestSchema>;

export const updatePrintConfigRequestSchema = createPrintConfigRequestSchema.partial();

export type UpdatePrintConfigRequest = z.infer<typeof updatePrintConfigRequestSchema>;

export interface PrintConfigResponse {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showFiventsLogo: boolean;
  fiventsLogoPosition: string;
  fiventsLogoSize: number;
  showOrgLogo: boolean;
  orgLogoPosition: string;
  orgLogoSize: number;
  showQrCode: boolean;
  qrCodePosition: string;
  qrCodeSize: number;
  qrCodeContent: string;
  showName: boolean;
  namePosition: string;
  nameFontSize: number;
  nameBold: boolean;
  showCompany: boolean;
  companyPosition: string;
  companyFontSize: number;
  showJobTitle: boolean;
  jobTitlePosition: string;
  jobTitleFontSize: number;
  itemsOrder: string[];
  printerDpi: number;
  printerType: string;
  printSpeed: number;
  copies: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
}
