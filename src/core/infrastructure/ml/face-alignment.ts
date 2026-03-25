/**
 * Face Alignment Module
 *
 * Aligns detected faces to normalized 112x112 images for embedding extraction.
 * Uses 5-point landmarks from SCRFD: left_eye, right_eye, nose, mouth_left, mouth_right
 *
 * Based on InsightFace alignment method (arcface_torch/backbones/alignment.py)
 */

// Standard arcface template landmarks for 112x112 image
// These are the target positions for the 5 landmarks after alignment
const ARCFACE_TEMPLATE_112 = [
  [38.2946, 51.6963], // left eye
  [73.5318, 51.5014], // right eye
  [56.0252, 71.7366], // nose tip
  [41.5493, 92.3655], // mouth left
  [70.7299, 92.2041], // mouth right
];

export interface Point2D {
  x: number;
  y: number;
}

export interface Landmarks5 {
  leftEye: Point2D;
  rightEye: Point2D;
  nose: Point2D;
  mouthLeft: Point2D;
  mouthRight: Point2D;
}

/**
 * Convert landmarks array to structured format
 */
export function parseLandmarks(landmarks: number[][]): Landmarks5 {
  if (landmarks.length !== 5) {
    throw new Error(`Expected 5 landmarks, got ${landmarks.length}`);
  }

  return {
    leftEye: { x: landmarks[0][0], y: landmarks[0][1] },
    rightEye: { x: landmarks[1][0], y: landmarks[1][1] },
    nose: { x: landmarks[2][0], y: landmarks[2][1] },
    mouthLeft: { x: landmarks[3][0], y: landmarks[3][1] },
    mouthRight: { x: landmarks[4][0], y: landmarks[4][1] },
  };
}

/**
 * Estimate 2D similarity transformation matrix from source to destination points
 * Returns [scale * cos(θ), scale * sin(θ), tx, ty] for transformation
 */
function estimateSimilarityTransform(src: number[][], dst: number[][]): { m: number[][]; scale: number } {
  const n = src.length;

  // Calculate centroids
  let srcMeanX = 0,
    srcMeanY = 0,
    dstMeanX = 0,
    dstMeanY = 0;
  for (let i = 0; i < n; i++) {
    srcMeanX += src[i][0];
    srcMeanY += src[i][1];
    dstMeanX += dst[i][0];
    dstMeanY += dst[i][1];
  }
  srcMeanX /= n;
  srcMeanY /= n;
  dstMeanX /= n;
  dstMeanY /= n;

  // Calculate covariance and variance
  let cov00 = 0,
    cov01 = 0,
    cov10 = 0,
    cov11 = 0;
  let srcVar = 0;

  for (let i = 0; i < n; i++) {
    const sx = src[i][0] - srcMeanX;
    const sy = src[i][1] - srcMeanY;
    const dx = dst[i][0] - dstMeanX;
    const dy = dst[i][1] - dstMeanY;

    cov00 += sx * dx;
    cov01 += sx * dy;
    cov10 += sy * dx;
    cov11 += sy * dy;

    srcVar += sx * sx + sy * sy;
  }

  // Calculate rotation and scale
  const a = cov00 + cov11;
  const b = cov10 - cov01;
  const scale = Math.sqrt(a * a + b * b) / srcVar;
  const cos = a / (srcVar * scale);
  const sin = b / (srcVar * scale);

  // Build transformation matrix [a, -b, tx; b, a, ty]
  const tx = dstMeanX - scale * (cos * srcMeanX - sin * srcMeanY);
  const ty = dstMeanY - scale * (sin * srcMeanX + cos * srcMeanY);

  const m = [
    [scale * cos, -scale * sin, tx],
    [scale * sin, scale * cos, ty],
  ];

  return { m, scale };
}

/**
 * Apply affine transformation to an image
 */
function warpAffine(
  srcCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  dstCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  matrix: number[][],
): void {
  // Get source image data
  const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
  const srcData = srcImageData.data;

  // Create destination image data
  const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
  const dstData = dstImageData.data;

  // Invert the transformation matrix for reverse mapping
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[0][2];
  const d = matrix[1][0];
  const e = matrix[1][1];
  const f = matrix[1][2];

  const det = a * e - b * d;
  const invA = e / det;
  const invB = -b / det;
  const invC = (b * f - e * c) / det;
  const invD = -d / det;
  const invE = a / det;
  const invF = (d * c - a * f) / det;

  // Bilinear interpolation
  for (let dy = 0; dy < dstHeight; dy++) {
    for (let dx = 0; dx < dstWidth; dx++) {
      // Map destination to source coordinates
      const sx = invA * dx + invB * dy + invC;
      const sy = invD * dx + invE * dy + invF;

      // Bilinear interpolation
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      if (x0 >= 0 && x1 < srcWidth && y0 >= 0 && y1 < srcHeight) {
        const fx = sx - x0;
        const fy = sy - y0;

        const idx00 = (y0 * srcWidth + x0) * 4;
        const idx01 = (y0 * srcWidth + x1) * 4;
        const idx10 = (y1 * srcWidth + x0) * 4;
        const idx11 = (y1 * srcWidth + x1) * 4;

        const dstIdx = (dy * dstWidth + dx) * 4;

        for (let c = 0; c < 4; c++) {
          const v00 = srcData[idx00 + c];
          const v01 = srcData[idx01 + c];
          const v10 = srcData[idx10 + c];
          const v11 = srcData[idx11 + c];

          const v0 = v00 * (1 - fx) + v01 * fx;
          const v1 = v10 * (1 - fx) + v11 * fx;
          dstData[dstIdx + c] = v0 * (1 - fy) + v1 * fy;
        }
      }
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);
}

/**
 * Align a face from source image using 5 landmarks
 * Returns a 112x112 aligned face image suitable for embedding extraction
 */
export function alignFace(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  landmarks: number[][],
  outputSize: number = 112,
): OffscreenCanvas {
  // Create output canvas
  const alignedCanvas = new OffscreenCanvas(outputSize, outputSize);
  const alignedCtx = alignedCanvas.getContext('2d')!;

  // Get source context
  const sourceCtx =
    sourceCanvas instanceof OffscreenCanvas
      ? (sourceCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D)
      : (sourceCanvas.getContext('2d') as CanvasRenderingContext2D);

  if (!sourceCtx) {
    throw new Error('Failed to get source canvas context');
  }

  // Estimate transformation from source landmarks to template
  const { m } = estimateSimilarityTransform(landmarks, ARCFACE_TEMPLATE_112);

  // Apply transformation
  warpAffine(sourceCtx, alignedCtx, sourceCanvas.width, sourceCanvas.height, outputSize, outputSize, m);

  return alignedCanvas;
}

/**
 * Preprocess aligned face image for ArcFace model input
 * - Normalizes to [-1, 1] range
 * - Returns CHW format Float32Array
 */
export function preprocessForArcFace(alignedCanvas: OffscreenCanvas | HTMLCanvasElement): Float32Array {
  const ctx = alignedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, alignedCanvas.width, alignedCanvas.height);
  const data = imageData.data;
  const size = alignedCanvas.width * alignedCanvas.height;

  // Create CHW tensor (3 x 112 x 112)
  const tensor = new Float32Array(3 * size);

  // Normalize to [-1, 1] and convert to CHW
  for (let i = 0; i < size; i++) {
    const pixelIdx = i * 4;
    // RGB channels normalized to [-1, 1]
    tensor[i] = data[pixelIdx] / 127.5 - 1; // R channel
    tensor[size + i] = data[pixelIdx + 1] / 127.5 - 1; // G channel
    tensor[2 * size + i] = data[pixelIdx + 2] / 127.5 - 1; // B channel
  }

  return tensor;
}

/**
 * Calculate face quality score based on landmarks
 * Higher score = better quality face image
 */
export function calculateFaceQuality(landmarks: number[][]): number {
  const parsed = parseLandmarks(landmarks);

  // Calculate inter-eye distance
  const eyeDistance = Math.sqrt(
    Math.pow(parsed.rightEye.x - parsed.leftEye.x, 2) + Math.pow(parsed.rightEye.y - parsed.leftEye.y, 2),
  );

  // Calculate face symmetry (mouth relative to nose)
  const mouthCenterX = (parsed.mouthLeft.x + parsed.mouthRight.x) / 2;
  const symmetryError = Math.abs(mouthCenterX - parsed.nose.x) / eyeDistance;

  // Calculate face rotation (eye angle)
  const eyeAngle = Math.atan2(parsed.rightEye.y - parsed.leftEye.y, parsed.rightEye.x - parsed.leftEye.x);
  const rotationScore = 1 - Math.min(Math.abs(eyeAngle) / 0.5, 1); // Penalize rotation > ~30 degrees

  // Combine scores
  const symmetryScore = Math.max(0, 1 - symmetryError * 2);
  const sizeScore = Math.min(eyeDistance / 30, 1); // Normalize eye distance (30px baseline)

  return symmetryScore * 0.3 + rotationScore * 0.4 + sizeScore * 0.3;
}

/**
 * Check if face is suitable for recognition
 */
export function isFaceSuitable(
  landmarks: number[][],
  minQuality: number = 0.5,
  minEyeDistance: number = 20,
): { suitable: boolean; reason?: string; quality: number } {
  const parsed = parseLandmarks(landmarks);

  // Check eye distance
  const eyeDistance = Math.sqrt(
    Math.pow(parsed.rightEye.x - parsed.leftEye.x, 2) + Math.pow(parsed.rightEye.y - parsed.leftEye.y, 2),
  );

  if (eyeDistance < minEyeDistance) {
    return {
      suitable: false,
      reason: 'Face too small or far away',
      quality: 0,
    };
  }

  // Calculate quality
  const quality = calculateFaceQuality(landmarks);

  if (quality < minQuality) {
    return {
      suitable: false,
      reason: 'Face quality too low (bad angle or lighting)',
      quality,
    };
  }

  return { suitable: true, quality };
}
