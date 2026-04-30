import { z } from 'zod/v4';

export const checkEmailRequestSchema = z.object({
  email: z.email('Invalid email address.'),
});

export type CheckEmailRequest = z.infer<typeof checkEmailRequestSchema>;
