import { z } from 'zod/v4';

import {
  adaptAndNormalizeFaceEmbedding,
  formatSupportedFaceEmbeddingDimensions,
  hasValidFaceEmbeddingMagnitude,
  isSupportedFaceEmbeddingDimension,
} from '@/core/utils/face-embedding';

const SUPPORTED_FACE_EMBEDDING_DIMENSIONS = formatSupportedFaceEmbeddingDimensions();

export const faceEmbeddingSchema = z
  .array(z.number().finite())
  .superRefine((embedding, ctx) => {
    if (!isSupportedFaceEmbeddingDimension(embedding.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Embedding must contain ${SUPPORTED_FACE_EMBEDDING_DIMENSIONS} dimensions.`,
      });
      return;
    }

    if (!hasValidFaceEmbeddingMagnitude(embedding)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Embedding has invalid magnitude. Please capture the face again.',
      });
    }
  })
  .transform((embedding) => adaptAndNormalizeFaceEmbedding(embedding));

export const registerFaceRequestSchema = z.object({
  imageUrl: z.string().url('Image URL must be a valid URL.').optional(),
  imageDataUrl: z.string().min(1, 'Image data URL is required.').optional(),
  embedding: faceEmbeddingSchema,
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
