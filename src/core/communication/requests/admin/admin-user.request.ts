import { z } from 'zod/v4';

export const createClientUserRequestSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    email: z.email('Invalid email address.'),
    role: z.enum(['ORG_OWNER', 'EVENT_MANAGER']).default('ORG_OWNER'),
    organizationId: z.string().min(1, 'Organization is required.').optional(),
    organizationName: z.string().min(1, 'Organization name is required.').optional(),
  })
  .refine((data) => data.organizationId || data.organizationName, {
    message: 'Organization is required. Select an existing one or create a new one.',
    path: ['organizationId'],
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
