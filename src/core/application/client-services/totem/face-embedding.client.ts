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
}): Promise<number[] | null> {
  const runtime = new TotemFaceRuntime();

  try {
    await runtime.init({ maxFaces: 1, minFaceSize: 80, livenessEnabled: false });

    const blob = await blobFromSource(input);
    const bitmap = await createImageBitmap(blob);
    const analysis = await runtime.analyze(bitmap);

    if (!analysis.face || analysis.faceCount !== 1) {
      return null;
    }

    return analysis.face.embedding;
  } finally {
    await runtime.dispose();
  }
}
