import { z } from 'zod/v4';

const roleSchema = z.enum(['SUPER_ADMIN', 'ORG_OWNER', 'EVENT_MANAGER']);

export const addMemberRequestSchema = z.object({
  role: roleSchema,
  userId: z.string().min(1, 'User ID is required.'),
  organizationId: z.string().min(1, 'Organization ID is required.'),
});

export type AddMemberRequest = z.infer<typeof addMemberRequestSchema>;

export const updateMemberRoleRequestSchema = z.object({
  role: roleSchema,
});

export type UpdateMemberRoleRequest = z.infer<typeof updateMemberRoleRequestSchema>;
