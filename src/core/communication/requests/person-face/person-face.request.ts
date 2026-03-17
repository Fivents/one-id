import { z } from 'zod/v4';

export const registerFaceRequestSchema = z.object({
  imageUrl: z.string().url('Image URL must be a valid URL.').optional(),
  imageDataUrl: z.string().min(1, 'Image data URL is required.').optional(),
  personId: z.string().min(1, 'Person ID is required.'),
}).refine((data) => !!data.imageUrl || !!data.imageDataUrl, {
  message: 'Provide imageUrl or imageDataUrl.',
  path: ['imageUrl'],
}).refine((data) => !(data.imageUrl && data.imageDataUrl), {
  message: 'Provide only one source: imageUrl or imageDataUrl.',
  path: ['imageDataUrl'],
});

export type RegisterFaceRequest = z.infer<typeof registerFaceRequestSchema>;
