import { z } from 'zod/v4';

export const registerParticipantRequestSchema = z.object({
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  personId: z.string().min(1, 'Person ID is required.'),
  eventId: z.string().min(1, 'Event ID is required.'),
});

export type RegisterParticipantRequest = z.infer<typeof registerParticipantRequestSchema>;

export const updateParticipantRequestSchema = z.object({
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
});

export type UpdateParticipantRequest = z.infer<typeof updateParticipantRequestSchema>;
