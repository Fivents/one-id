import { z } from 'zod/v4';

const documentTypeSchema = z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'OTHER']);

export const createPersonRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Invalid email address.'),
  document: z.string().nullable().optional(),
  documentType: documentTypeSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  birthDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
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
  jobTitle: z.string().nullable().optional(),
  birthDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  qrCodeValue: z.string().min(1).nullable().optional(),
  accessCode: z.string().min(1).nullable().optional(),
});

export type UpdatePersonRequest = z.infer<typeof updatePersonRequestSchema>;

const importPersonItemSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Invalid email address.').nullable().optional(),
  document: z.string().nullable().optional(),
  documentType: documentTypeSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  birthDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => data.email || data.document,
  { message: 'Email or CPF is required.' },
);

export const importPersonsRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  overwrite: z.boolean().default(false),
  persons: z.array(importPersonItemSchema),
});

export type ImportPersonsRequest = z.infer<typeof importPersonsRequestSchema>;
