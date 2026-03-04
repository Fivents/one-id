import { z } from 'zod/v4';

export const loginAccessCodeRequestSchema = z.object({
  accessCode: z.string().min(1, 'Access code is required.'),
});

export type LoginAccessCodeRequest = z.infer<typeof loginAccessCodeRequestSchema>;
