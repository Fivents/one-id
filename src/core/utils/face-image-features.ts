import { createHash } from 'crypto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EMBEDDING_DIMENSION = 128;

export interface FaceImageInput {
  imageUrl?: string;
  imageDataUrl?: string;
}

export interface FaceImageFeatures {
  imageHash: string;
  embedding: Buffer;
  storedImageUrl: string;
}

function parseDataUrlImage(imageDataUrl: string): Buffer {
  const match = imageDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid imageDataUrl format. Expected a base64 data URL for an image.');
  }

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length === 0) {
    throw new Error('Empty image content.');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds maximum allowed size of 5MB.');
  }

  return buffer;
}

async function fetchImageFromUrl(imageUrl: string): Promise<Buffer> {
  let parsed: URL;

  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error('Invalid image URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https image URLs are supported.');
  }

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      Accept: 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download image from URL.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error('The provided URL does not return an image.');
  }

  const imageArrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(imageArrayBuffer);

  if (imageBuffer.length === 0) {
    throw new Error('Downloaded image is empty.');
  }

  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds maximum allowed size of 5MB.');
  }

  return imageBuffer;
}

function buildEmbedding(imageBuffer: Buffer): Buffer {
  const embedding = new Float32Array(EMBEDDING_DIMENSION);

  for (let index = 0; index < imageBuffer.length; index += 1) {
    const value = imageBuffer[index] / 255;
    embedding[index % EMBEDDING_DIMENSION] += value;
  }

  let norm = 0;
  for (let index = 0; index < EMBEDDING_DIMENSION; index += 1) {
    norm += embedding[index] * embedding[index];
  }

  const safeNorm = Math.sqrt(norm) || 1;
  for (let index = 0; index < EMBEDDING_DIMENSION; index += 1) {
    embedding[index] = embedding[index] / safeNorm;
  }

  return Buffer.from(embedding.buffer);
}

export async function generateFaceImageFeatures(input: FaceImageInput): Promise<FaceImageFeatures> {
  const hasImageUrl = !!input.imageUrl?.trim();
  const hasImageDataUrl = !!input.imageDataUrl?.trim();

  if (!hasImageUrl && !hasImageDataUrl) {
    throw new Error('Either imageUrl or imageDataUrl must be provided.');
  }

  if (hasImageUrl && hasImageDataUrl) {
    throw new Error('Provide either imageUrl or imageDataUrl, not both.');
  }

  const imageBuffer = hasImageDataUrl
    ? parseDataUrlImage(input.imageDataUrl!.trim())
    : await fetchImageFromUrl(input.imageUrl!.trim());

  const imageHash = createHash('sha256').update(imageBuffer).digest('hex');
  const embedding = buildEmbedding(imageBuffer);
  const storedImageUrl = hasImageUrl ? input.imageUrl!.trim() : `captured://${imageHash}`;

  return {
    imageHash,
    embedding,
    storedImageUrl,
  };
}
