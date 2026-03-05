import { z } from 'zod/v4';

export const registerFaceRequestSchema = z.object({
  embedding: z.string().min(1, 'Embedding is required.'),
  imageHash: z.string().min(1, 'Image hash is required.'),
  imageUrl: z.string().url('Image URL must be a valid URL.'),
  personId: z.string().min(1, 'Person ID is required.'),
});

export type RegisterFaceRequest = z.infer<typeof registerFaceRequestSchema>;
