import { z } from 'zod/v4';

const documentTypeSchema = z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'OTHER']);

export const createPersonRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Invalid email address.'),
  document: z.string().nullable().optional(),
  documentType: documentTypeSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  qrCodeValue: z.string().min(1).nullable().optional(),
  accessCode: z.string().min(1).nullable().optional(),
  organizationId: z.string().min(1, 'Organization ID is required.'),
});

export type CreatePersonRequest = z.infer<typeof createPersonRequestSchema>;

export const updatePersonRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email('Invalid email address.').optional(),
  document: z.string().nullable().optional(),
  documentType: documentTypeSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  qrCodeValue: z.string().min(1).nullable().optional(),
  accessCode: z.string().min(1).nullable().optional(),
});

export type UpdatePersonRequest = z.infer<typeof updatePersonRequestSchema>;

export const importPersonsRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  persons: z.array(
    z.object({
      name: z.string().min(1, 'Name is required.'),
      email: z.email('Invalid email address.'),
      document: z.string().nullable().optional(),
      documentType: documentTypeSchema.nullable().optional(),
      phone: z.string().nullable().optional(),
      qrCodeValue: z.string().min(1).nullable().optional(),
      accessCode: z.string().min(1).nullable().optional(),
    }),
  ),
});

export type ImportPersonsRequest = z.infer<typeof importPersonsRequestSchema>;
