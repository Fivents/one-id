import { z } from 'zod/v4';

export const createClientUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Invalid email address.'),
  organizationId: z.string().min(1, 'Organization is required.').optional(),
  organizationName: z.string().min(1, 'Organization name is required.').optional(),
});

export type CreateClientUserRequest = z.infer<typeof createClientUserRequestSchema>;

export const updateClientUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.').optional(),
  email: z.email('Invalid email address.').optional(),
});

export type UpdateClientUserRequest = z.infer<typeof updateClientUserRequestSchema>;

export const resetUserPasswordRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
});

export type ResetUserPasswordRequest = z.infer<typeof resetUserPasswordRequestSchema>;
