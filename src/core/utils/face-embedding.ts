export const FACE_EMBEDDING_DIMENSION = 512;
export const FACE_EMBEDDING_ALTERNATIVE_DIMENSION = 1024;

const MIN_EMBEDDING_NORM = 1e-8;

export function formatSupportedFaceEmbeddingDimensions(): string {
  return `${FACE_EMBEDDING_DIMENSION} or ${FACE_EMBEDDING_ALTERNATIVE_DIMENSION}`;
}

export function isSupportedFaceEmbeddingDimension(dimension: number): boolean {
  return dimension === FACE_EMBEDDING_DIMENSION || dimension === FACE_EMBEDDING_ALTERNATIVE_DIMENSION;
}

export function adaptFaceEmbeddingToTargetDimension(embedding: number[]): number[] {
  if (embedding.length === FACE_EMBEDDING_DIMENSION) {
    return [...embedding];
  }

  if (embedding.length === FACE_EMBEDDING_ALTERNATIVE_DIMENSION) {
    const reduced = new Array<number>(FACE_EMBEDDING_DIMENSION);

    // Deterministic fold from 1024 -> 512 so enrollment and check-in stay in the same vector space.
    for (let i = 0; i < FACE_EMBEDDING_DIMENSION; i += 1) {
      reduced[i] = (embedding[i] + embedding[i + FACE_EMBEDDING_DIMENSION]) / 2;
    }

    return reduced;
  }

  throw new Error(`Unsupported embedding dimension: ${embedding.length}`);
}

export function hasValidFaceEmbeddingMagnitude(embedding: number[]): boolean {
  if (!isSupportedFaceEmbeddingDimension(embedding.length)) {
    return false;
  }

  const adapted = adaptFaceEmbeddingToTargetDimension(embedding);
  let normSquared = 0;

  for (let i = 0; i < adapted.length; i += 1) {
    normSquared += adapted[i] * adapted[i];
  }

  return normSquared > MIN_EMBEDDING_NORM;
}

export function adaptAndNormalizeFaceEmbedding(embedding: number[]): number[] {
  const adapted = adaptFaceEmbeddingToTargetDimension(embedding);

  let normSquared = 0;
  for (let i = 0; i < adapted.length; i += 1) {
    normSquared += adapted[i] * adapted[i];
  }

  if (normSquared <= MIN_EMBEDDING_NORM) {
    return adapted;
  }

  const norm = Math.sqrt(normSquared);
  for (let i = 0; i < adapted.length; i += 1) {
    adapted[i] = adapted[i] / norm;
  }

  return adapted;
}
