/**
 * Secret Cipher Contract
 *
 * Encrypts short-lived or long-lived secrets (third-party API tokens) at rest.
 * Mirrors the envelope used by the face-embedding encryption so a single key-rotation
 * story covers both.
 */

export interface EncryptedSecret {
  version: number; // Key version, for rotation
  iv: string; // Base64-encoded initialization vector
  ciphertext: string; // Base64-encoded encrypted data
  authTag: string; // Base64-encoded GCM authentication tag
}

export interface ISecretCipher {
  encrypt(plaintext: string): EncryptedSecret;
  decrypt(secret: EncryptedSecret): string;
  addAlternateKey(version: number, keyBase64: string): void;
  getCurrentKeyVersion(): number;
}

export function isEncryptedSecret(value: unknown): value is EncryptedSecret {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.version === 'number' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string' &&
    typeof candidate.authTag === 'string'
  );
}
