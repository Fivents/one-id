import { z } from 'zod/v4';

export const createOrganizationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  email: z.email('Invalid email address.').nullable().optional(),
  phone: z.string().nullable().optional(),
  logoUrl: z.string().url('Invalid URL.').nullable().optional(),
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;

export const updateOrganizationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.').optional(),
  slug: z.string().min(1, 'Slug is required.').optional(),
  email: z.email('Invalid email address.').nullable().optional(),
  phone: z.string().nullable().optional(),
  logoUrl: z.string().url('Invalid URL.').nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>;
