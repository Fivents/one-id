import { z } from "zod/v4";

export const createParticipantSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.email("E-mail inválido").optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const updateParticipantSchema = createParticipantSchema.partial();

const emptyToUndefined = z.string().transform((v) => (v.trim() === "" ? undefined : v));

export const importParticipantRowSchema = z.object({
  name: z.string().min(1),
  email: emptyToUndefined.optional(),
  document: emptyToUndefined.optional(),
  phone: emptyToUndefined.optional(),
  company: emptyToUndefined.optional(),
  jobTitle: emptyToUndefined.optional(),
  faceImageUrl: emptyToUndefined.pipe(z.string().url().optional()).optional(),
});

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type ImportParticipantRow = z.infer<typeof importParticipantRowSchema>;
