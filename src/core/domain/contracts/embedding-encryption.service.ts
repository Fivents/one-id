/**
 * Embedding Encryption Service Contract (Interface)
 *
 * Defines the contract for encrypting/decrypting face embeddings
 */

export interface EncryptedEmbedding {
  version: number; // Key version for rotation
  iv: string; // Base64-encoded initialization vector
  ciphertext: string; // Base64-encoded encrypted data
  authTag: string; // Base64-encoded authentication tag
}

export interface DecryptedEmbedding {
  embedding: number[];
  keyVersion: number;
  decryptedAt: Date;
}

export interface IEmbeddingEncryptionService {
  /**
   * Encrypt a face embedding for storage
   */
  encrypt(embedding: number[]): EncryptedEmbedding;

  /**
   * Decrypt a face embedding from storage
   * Throws if authentication tag verification fails
   */
  decrypt(encrypted: EncryptedEmbedding): DecryptedEmbedding;

  /**
   * Add alternate key for key rotation
   */
  addAlternateKey(version: number, keyBase64: string): void;

  /**
   * Rotate to new master key
   */
  rotateKey(newMasterKeyBase64: string): void;

  /**
   * Get current key version
   */
  getCurrentKeyVersion(): number;

  /**
   * Validate key availability
   */
  validateKeyAvailability(): boolean;

  /**
   * Benchmark encryption/decryption performance
   */
  benchmark(iterations?: number): {
    encryptMs: number;
    decryptMs: number;
    throughputMbps: number;
  };
}
