import { z } from 'zod/v4';

export const setupPasswordRequestSchema = z
  .object({
    token: z.string().min(1, 'Setup token is required.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Password confirmation is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SetupPasswordRequest = z.infer<typeof setupPasswordRequestSchema>;
