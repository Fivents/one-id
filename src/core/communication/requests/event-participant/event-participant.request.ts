import { z } from 'zod/v4';

export const registerParticipantRequestSchema = z
  .object({
    company: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    qrCodeValue: z.string().min(1).nullable().optional(),
    accessCode: z.string().min(1).nullable().optional(),
    personId: z.string().min(1, 'Person ID is required.').optional(),
    name: z.string().min(1, 'Name is required.').optional(),
    email: z.email('Invalid email address.').optional(),
    document: z.string().nullable().optional(),
    documentType: z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'OTHER']).nullable().optional(),
    phone: z.string().nullable().optional(),
    eventId: z.string().min(1, 'Event ID is required.'),
  })
  .refine((data) => !!data.personId || (!!data.email && !!data.name), {
    message: 'Provide personId or name and email.',
    path: ['personId'],
  });

export type RegisterParticipantRequest = z.infer<typeof registerParticipantRequestSchema>;

export const updateParticipantRequestSchema = z.object({
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  qrCodeValue: z.string().min(1).nullable().optional(),
  accessCode: z.string().min(1).nullable().optional(),
});

export type UpdateParticipantRequest = z.infer<typeof updateParticipantRequestSchema>;
