import { z } from "zod/v4";

export const createParticipantSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.email("E-mail inválido").optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
});

export const updateParticipantSchema = createParticipantSchema.partial();

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
