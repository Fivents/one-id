import { z } from 'zod/v4';

export const connectSymplaRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10, 'Informe o token de acesso da Sympla.')
    .max(500, 'Token inválido.'),
});

export type ConnectSymplaRequest = z.infer<typeof connectSymplaRequestSchema>;
