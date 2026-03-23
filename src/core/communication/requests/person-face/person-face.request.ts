import { z } from 'zod/v4';

const FACE_EMBEDDING_DIMENSION = 512;

export const registerFaceRequestSchema = z.object({
  imageUrl: z.string().url('Image URL must be a valid URL.').optional(),
  imageDataUrl: z.string().min(1, 'Image data URL is required.').optional(),
  embedding: z
    .array(z.number().finite())
    .length(FACE_EMBEDDING_DIMENSION, `Embedding must contain ${FACE_EMBEDDING_DIMENSION} dimensions.`),
  embeddingModel: z.string().min(1).max(120).optional(),
  personId: z.string().min(1, 'Person ID is required.'),
  // Optional: raw face detection data for quality assessment
  faceDetectionData: z.record(z.string(), z.unknown()).optional(),
  // NEW (Phase 2): Template position for multi-pose enrollment
  templatePosition: z.enum(['center', 'left', 'right', 'up', 'down']).optional(),
  // NEW (Phase 2): Group multiple poses in one enrollment session
  templateSetId: z.string().min(1).optional(),
});

export type RegisterFaceRequest = z.infer<typeof registerFaceRequestSchema>;
