import { z } from 'zod/v4';

export const renewTotemSessionRequestSchema = z.object({
  totemId: z.string().min(1, 'Totem ID is required.'),
});

export type RenewTotemSessionRequest = z.infer<typeof renewTotemSessionRequestSchema>;
