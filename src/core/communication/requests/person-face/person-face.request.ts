import { z } from 'zod/v4';

const FACE_EMBEDDING_DIMENSION = 512;

export const registerFaceRequestSchema = z
  .object({
    imageUrl: z.string().url('Image URL must be a valid URL.').optional(),
    imageDataUrl: z.string().min(1, 'Image data URL is required.').optional(),
    embedding: z
      .array(z.number().finite())
      .length(FACE_EMBEDDING_DIMENSION, `Embedding must contain ${FACE_EMBEDDING_DIMENSION} dimensions.`),
    embeddingModel: z.string().min(1).max(120).optional(),
    personId: z.string().min(1, 'Person ID is required.'),
  })
  .refine((data) => !!data.imageUrl || !!data.imageDataUrl, {
    message: 'Provide imageUrl or imageDataUrl to store participant photo.',
    path: ['embedding'],
  })
  .refine((data) => !(data.imageUrl && data.imageDataUrl), {
    message: 'Provide only one source: imageUrl or imageDataUrl.',
    path: ['imageDataUrl'],
  });

export type RegisterFaceRequest = z.infer<typeof registerFaceRequestSchema>;
