import { z } from "zod/v4";

export const createPlanSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  tier: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"]),
  description: z.string().optional(),
  price: z.number().min(0, "Preço não pode ser negativo").default(0),
  maxEvents: z.number().int().positive().default(1),
  maxParticipantsPerEvent: z.number().int().positive().default(100),
  maxTotems: z.number().int().positive().default(1),
  maxMembers: z.number().int().positive().default(5),
  maxCheckInPointsPerEvent: z.number().int().positive().default(1),
  allowFacial: z.boolean().default(true),
  allowQrCode: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
