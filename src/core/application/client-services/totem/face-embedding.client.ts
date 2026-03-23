import { TotemFaceRuntime } from './totem-face-runtime.client';

async function blobFromSource(input: { imageDataUrl?: string; imageUrl?: string }): Promise<Blob> {
  if (input.imageDataUrl?.trim()) {
    const response = await fetch(input.imageDataUrl.trim());
    return response.blob();
  }

  if (input.imageUrl?.trim()) {
    const response = await fetch(input.imageUrl.trim(), {
      method: 'GET',
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download image URL for embedding extraction.');
    }

    return response.blob();
  }

  throw new Error('Missing image source for embedding extraction.');
}

export async function extractFaceEmbedding(input: {
  imageDataUrl?: string;
  imageUrl?: string;
}): Promise<{ embedding: number[]; faceCount: number } | null> {
  const runtime = new TotemFaceRuntime();

  try {
    await runtime.init({ maxFaces: 1, minFaceSize: 80, livenessEnabled: false });

    const blob = await blobFromSource(input);
    const bitmap = await createImageBitmap(blob);
    const analysis = await runtime.analyze(bitmap);

    if (!analysis.face) {
      if (analysis.faceCount === 0) {
        throw new Error('No face detected in the image. Please ensure your face is clearly visible in the photo.');
      }
      throw new Error('Face detection failed. Please try again with a clearer image.');
    }

    if (analysis.faceCount !== 1) {
      throw new Error(`Detected ${analysis.faceCount} faces. Please provide an image with exactly one face.`);
    }

    if (!analysis.face.isBigEnough) {
      throw new Error('Face is too small in the image. Please move closer to the camera or use a larger face in the photo.');
    }

    return {
      embedding: analysis.face.embedding,
      faceCount: analysis.faceCount,
    };
  } finally {
    await runtime.dispose();
  }
}
