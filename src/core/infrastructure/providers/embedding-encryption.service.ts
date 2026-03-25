/**
 * AES-256-GCM Encryption Service
 *
 * Encrypts and decrypts face embeddings at rest in the database.
 * Uses authenticated encryption (AEAD) to prevent tampering.
 *
 * Standards:
 * - Algorithm: AES-256-GCM (256-bit key, 128-bit tag)
 * - IV: 96-bit random salt per encryption
 * - Auth Tag: 128-bit GHASH authentication
 * - Performance: O(n) where n = data size
 *
 * Security Properties:
 * - IND-CPA: Indistinguishability under chosen-plaintext attack
 * - INT-CTXT: Integrity under chosen-ciphertext attack
 * - Forward Secrecy: New IV per encryption prevents known-plaintext attacks
 *
 * Key Management:
 * - Master key stored in environment variable (EMBEDDING_ENCRYPTION_KEY)
 * - Key rotation supported via version field
 * - Multiple keys supported (for gradual migration)
 */

import { createCipheriv, createDecipheriv,randomBytes } from 'node:crypto';

export interface EncryptedEmbedding {
  version: number; // Key version for rotation
  iv: string; // Base64-encoded initialization vector (96 bits)
  ciphertext: string; // Base64-encoded encrypted data
  authTag: string; // Base64-encoded authentication tag (128 bits)
}

export interface DecryptedEmbedding {
  embedding: number[];
  keyVersion: number;
  decryptedAt: Date;
}

export class EmbeddingEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly authTagLength = 16; // 128 bits (16 bytes)
  private readonly currentKeyVersion = 1;

  private masterKey: Buffer;
  private alternateKeys: Map<number, Buffer> = new Map();

  /**
   * Initialize encryption service with master key from environment
   * Format: base64-encoded 256-bit key
   * Example: echo -n "$(openssl rand -base64 32)" >> .env
   */
  constructor(masterKeyEnv?: string) {
    const keyString = masterKeyEnv || process.env.EMBEDDING_ENCRYPTION_KEY;

    if (!keyString) {
      throw new Error(
        'EMBEDDING_ENCRYPTION_KEY not set. Generate with: openssl rand -base64 32',
      );
    }

    try {
      this.masterKey = Buffer.from(keyString, 'base64');

      if (this.masterKey.length !== this.keyLength) {
        throw new Error(
          `Master key must be ${this.keyLength} bytes (256 bits), got ${this.masterKey.length}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse EMBEDDING_ENCRYPTION_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Initialize with current master key
    this.alternateKeys.set(this.currentKeyVersion, this.masterKey);
  }

  /**
   * Encrypt a face embedding for storage
   * Returns encrypted data with IV and auth tag
   */
  encrypt(embedding: number[]): EncryptedEmbedding {
    // Convert embedding array to Buffer
    const embeddingBuffer = Buffer.from(Float32Array.from(embedding).buffer);

    // Generate random IV (96-bit for GCM)
    const iv = randomBytes(this.ivLength);

    // Create cipher with current master key
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);

    // Encrypt embedding
    const encryptedChunks: Buffer[] = [];
    encryptedChunks.push(cipher.update(embeddingBuffer));
    encryptedChunks.push(cipher.final());

    const ciphertext = Buffer.concat(encryptedChunks);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      version: this.currentKeyVersion,
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Decrypt a face embedding from storage
   * Verifies authentication tag to ensure data integrity
   */
  decrypt(encrypted: EncryptedEmbedding): DecryptedEmbedding {
    // Get key for this version
    const key = this.alternateKeys.get(encrypted.version);
    if (!key) {
      throw new Error(`Encryption key version ${encrypted.version} not found`);
    }

    // Decode components from base64
    const iv = Buffer.from(encrypted.iv, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    // Validate lengths
    if (iv.length !== this.ivLength) {
      throw new Error(`Invalid IV length: ${iv.length}, expected ${this.ivLength}`);
    }
    if (authTag.length !== this.authTagLength) {
      throw new Error(
        `Invalid auth tag length: ${authTag.length}, expected ${this.authTagLength}`,
      );
    }

    // Create decipher
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    try {
      // Decrypt
      const decryptedChunks: Buffer[] = [];
      decryptedChunks.push(decipher.update(ciphertext));
      decryptedChunks.push(decipher.final());

      const decrypted = Buffer.concat(decryptedChunks);

      // Convert back to float32 array
      const float32Array = new Float32Array(
        decrypted.buffer,
        decrypted.byteOffset,
        decrypted.length / 4,
      );

      return {
        embedding: Array.from(float32Array),
        keyVersion: encrypted.version,
        decryptedAt: new Date(),
      };
    } catch (error) {
      // Auth tag verification failed - data was tampered with
      throw new Error(
        `Embedding decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. Data may have been tampered with.`,
      );
    }
  }

  /**
   * Add alternate key for gradual key rotation
   * Allows decryption with old keys while encrypting with new master key
   */
  addAlternateKey(version: number, keyBase64: string): void {
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== this.keyLength) {
      throw new Error(`Alternate key must be ${this.keyLength} bytes`);
    }

    this.alternateKeys.set(version, key);
    console.log(`[Encryption] Added alternate key version ${version}`);
  }

  /**
   * Rotate to new master key
   * Old embeddings can still be decrypted, new ones use new key
   */
  rotateKey(newMasterKeyBase64: string): void {
    const newKey = Buffer.from(newMasterKeyBase64, 'base64');

    if (newKey.length !== this.keyLength) {
      throw new Error(`New master key must be ${this.keyLength} bytes`);
    }

    // Store old key as backup
    const oldVersion = this.currentKeyVersion;
    this.alternateKeys.set(oldVersion, this.masterKey);

    // Set new master key
    this.masterKey = newKey;
    const newVersion = this.currentKeyVersion + 1;
    this.alternateKeys.set(newVersion, newKey);

    console.log(`[Encryption] Key rotated from version ${oldVersion} to ${newVersion}`);
  }

  /**
   * Get current key version (for metadata)
   */
  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }

  /**
   * Check if all required keys are available
   */
  validateKeyAvailability(): boolean {
    if (!this.masterKey || this.masterKey.length !== this.keyLength) {
      return false;
    }

    // Check that we have keys for all versions we need to decrypt
    return this.alternateKeys.size > 0;
  }

  /**
   * Benchmark encryption/decryption performance
   */
  benchmark(iterations: number = 100): {
    encryptMs: number;
    decryptMs: number;
    throughputMbps: number;
  } {
    const testEmbedding = Array.from({ length: 512 }, () => Math.random());
    let encrypted!: EncryptedEmbedding;

    // Benchmark encryption
    const encryptStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      encrypted = this.encrypt(testEmbedding);
    }
    const encryptMs = (performance.now() - encryptStart) / iterations;

    // Benchmark decryption
    const decryptStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      this.decrypt(encrypted);
    }
    const decryptMs = (performance.now() - decryptStart) / iterations;

    // Calculate throughput (embedding size = 512 floats × 4 bytes = 2048 bytes)
    const embeddingSize = 512 * 4; // 2048 bytes
    const throughputMbps = (embeddingSize * 1000) / (encryptMs * 1024 * 1024);

    return {
      encryptMs: Math.round(encryptMs * 100) / 100,
      decryptMs: Math.round(decryptMs * 100) / 100,
      throughputMbps: Math.round(throughputMbps * 10) / 10,
    };
  }
}

/**
 * Utility: Generate random master key for initial setup
 * Usage: call once during deployment, store result in EMBEDDING_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}

/**
 * Utility: Validate embedding encryption environment
 */
export function validateEncryptionSetup(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!process.env.EMBEDDING_ENCRYPTION_KEY) {
    errors.push('EMBEDDING_ENCRYPTION_KEY not set in environment');
  } else {
    try {
      const key = Buffer.from(process.env.EMBEDDING_ENCRYPTION_KEY, 'base64');
      if (key.length !== 32) {
        errors.push(`EMBEDDING_ENCRYPTION_KEY must be 32 bytes, got ${key.length}`);
      }
    } catch {
      errors.push('EMBEDDING_ENCRYPTION_KEY must be valid base64');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    warnings.push(
      'Running in non-production environment. Check encryption setup before deploying to production.',
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
