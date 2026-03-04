import { z } from 'zod/v4';

export const loginEmailRequestSchema = z.object({
  email: z.email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginEmailRequest = z.infer<typeof loginEmailRequestSchema>;
