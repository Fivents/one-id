import { z } from 'zod/v4';

export const createUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Invalid email address.'),
  avatarUrl: z.string().url('Invalid URL.').optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.').optional(),
  email: z.email('Invalid email address.').optional(),
  avatarUrl: z.string().url('Invalid URL.').nullable().optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
