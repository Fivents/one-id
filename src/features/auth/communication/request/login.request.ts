import { z } from 'zod/v4';

export const loginResquestBodySchema = z.object({
  email: z.email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

export type LoginResquestBody = z.infer<typeof loginResquestBodySchema>;
