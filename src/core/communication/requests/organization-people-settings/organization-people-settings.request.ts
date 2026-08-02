import { z } from 'zod/v4';

export const codeSourceFieldOptions = ['NONE', 'DOCUMENT', 'PHONE', 'EMAIL'] as const;
export type CodeSourceFieldOption = (typeof codeSourceFieldOptions)[number];

export const updateOrganizationPeopleSettingsRequestSchema = z.object({
  accessCodeSource: z.enum(codeSourceFieldOptions).optional(),
  qrCodeSource: z.enum(codeSourceFieldOptions).optional(),
});

export type UpdateOrganizationPeopleSettingsRequest = z.infer<typeof updateOrganizationPeopleSettingsRequestSchema>;

export interface OrganizationPeopleSettingsResponse {
  organizationId: string;
  accessCodeSource: CodeSourceFieldOption;
  qrCodeSource: CodeSourceFieldOption;
  createdAt: string;
  updatedAt: string;
}
