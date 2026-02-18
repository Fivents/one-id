/**
 * Storage Service
 *
 * Abstraction for file uploads. Currently stores files locally in the /public/uploads
 * directory. In production, switch to S3/Cloudflare R2 via environment variable.
 *
 * Files are organized by type:
 *   /uploads/faces/{orgId}/{participantId}.jpg
 *   /uploads/logos/{orgId}/logo.png
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type UploadCategory = "faces" | "logos" | "labels";

/**
 * Save an uploaded file and return the public URL path
 */
export async function saveFile(
  file: Buffer,
  category: UploadCategory,
  organizationId: string,
  filename?: string
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, category, organizationId);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const finalName = filename ?? `${crypto.randomUUID()}.jpg`;
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(finalName);
  const filePath = path.join(dir, safeName);

  await writeFile(filePath, file);

  return `/uploads/${category}/${organizationId}/${safeName}`;
}

/**
 * Save a face image for a participant
 */
export async function saveFaceImage(
  imageBuffer: Buffer,
  organizationId: string,
  participantId: string
): Promise<string> {
  return saveFile(imageBuffer, "faces", organizationId, `${participantId}.jpg`);
}

/**
 * Save an organization logo
 */
export async function saveOrgLogo(
  imageBuffer: Buffer,
  organizationId: string,
  extension = "png"
): Promise<string> {
  return saveFile(imageBuffer, "logos", organizationId, `logo.${extension}`);
}

/**
 * Convert a base64 data URL to a Buffer
 */
export function base64ToBuffer(base64DataUrl: string): Buffer {
  const matches = base64DataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }
  return Buffer.from(matches[1], "base64");
}
