import { z } from "zod/v4";

export const createEventSchema = z.object({
  name: z.string().min(3, "Nome do evento deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  location: z.string().optional(),
  address: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  checkInMethods: z.array(z.enum(["FACIAL", "QR_CODE", "MANUAL"])).default(["FACIAL"]),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
