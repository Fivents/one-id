import { z } from "zod/v4";

export const createTotemSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  eventId: z.string().min(1, "Evento é obrigatório"),
  checkInPointId: z.string().min(1, "Ponto de check-in é obrigatório"),
});

export const totemAuthSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória"),
});

export const performCheckInSchema = z.object({
  participantId: z.string().min(1, "Participante é obrigatório"),
  method: z.enum(["FACIAL", "QR_CODE", "MANUAL"]),
  confidence: z.number().min(0).max(1).optional(),
});

export type CreateTotemInput = z.infer<typeof createTotemSchema>;
export type TotemAuthInput = z.infer<typeof totemAuthSchema>;
export type PerformCheckInInput = z.infer<typeof performCheckInSchema>;
