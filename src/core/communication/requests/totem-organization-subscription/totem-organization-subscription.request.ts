import { z } from 'zod/v4';

export const linkTotemToOrgRequestSchema = z.object({
  totemId: z.string().min(1, 'Totem ID is required.'),
  organizationId: z.string().min(1, 'Organization ID is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type LinkTotemToOrgRequest = z.infer<typeof linkTotemToOrgRequestSchema>;
