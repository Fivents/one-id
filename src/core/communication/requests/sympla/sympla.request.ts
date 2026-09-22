import { z } from 'zod/v4';

export const connectSymplaRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10, 'Informe o token de acesso da Sympla.')
    .max(500, 'Token inválido.'),
});

export type ConnectSymplaRequest = z.infer<typeof connectSymplaRequestSchema>;

export const linkEventToSymplaRequestSchema = z.object({
  symplaEventIdHash: z
    .string()
    .trim()
    .min(1, 'Selecione um evento da Sympla.')
    .max(200, 'Identificador de evento inválido.'),
});

export type LinkEventToSymplaRequest = z.infer<typeof linkEventToSymplaRequestSchema>;
