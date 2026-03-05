import { z } from 'zod/v4';

const checkInMethodSchema = z.enum(['FACE_RECOGNITION', 'QR_CODE', 'MANUAL']);

export const registerCheckInRequestSchema = z.object({
  method: checkInMethodSchema,
  confidence: z.number().min(0).max(1).nullable().optional(),
  eventParticipantId: z.string().min(1, 'Event participant ID is required.'),
  totemEventSubscriptionId: z.string().min(1, 'Totem event subscription ID is required.'),
});

export type RegisterCheckInRequest = z.infer<typeof registerCheckInRequestSchema>;

export const checkParticipantCheckInRequestSchema = z.object({
  eventParticipantId: z.string().min(1, 'Event participant ID is required.'),
  totemEventSubscriptionId: z.string().min(1, 'Totem event subscription ID is required.'),
});

export type CheckParticipantCheckInRequest = z.infer<typeof checkParticipantCheckInRequestSchema>;
