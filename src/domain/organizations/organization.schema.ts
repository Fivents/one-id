import { z } from "zod/v4";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  document: z.string().optional(),
  email: z.email("E-mail inválido").optional(),
  phone: z.string().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
