/**
 * AES-256-GCM Secret Cipher
 *
 * Encrypts third-party API tokens at rest. Same algorithm, envelope and rotation model as
 * EmbeddingEncryptionService — the difference is the payload (UTF-8 string, not Float32Array)
 * and the key (SYMPLA_TOKEN_KEY, kept separate so rotating a token key never touches biometrics).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import type { EncryptedSecret, ISecretCipher } from '@/core/domain/contracts/secret-cipher.service';
import { SymplaNotConfiguredError } from '@/core/errors';

export class SecretCipherService implements ISecretCipher {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly authTagLength = 16; // 128 bits
  private readonly currentKeyVersion = 1;

  private readonly masterKey: Buffer;
  private readonly alternateKeys = new Map<number, Buffer>();

  /**
   * @param masterKeyBase64 base64-encoded 256-bit key. Generate with: openssl rand -base64 32
   */
  constructor(masterKeyBase64: string | undefined) {
    if (!masterKeyBase64) {
      throw new SymplaNotConfiguredError({ reason: 'MISSING_ENCRYPTION_KEY' });
    }

    const key = Buffer.from(masterKeyBase64, 'base64');

    if (key.length !== this.keyLength) {
      throw new SymplaNotConfiguredError({
        reason: 'INVALID_ENCRYPTION_KEY_LENGTH',
        expectedBytes: this.keyLength,
        actualBytes: key.length,
      });
    }

    this.masterKey = key;
    this.alternateKeys.set(this.currentKeyVersion, key);
  }

  encrypt(plaintext: string): EncryptedSecret {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    return {
      version: this.currentKeyVersion,
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  decrypt(secret: EncryptedSecret): string {
    const key = this.alternateKeys.get(secret.version);
    if (!key) {
      throw new SymplaNotConfiguredError({ reason: 'UNKNOWN_KEY_VERSION', keyVersion: secret.version });
    }

    const iv = Buffer.from(secret.iv, 'base64');
    const ciphertext = Buffer.from(secret.ciphertext, 'base64');
    const authTag = Buffer.from(secret.authTag, 'base64');

    if (iv.length !== this.ivLength) {
      throw new SymplaNotConfiguredError({ reason: 'INVALID_IV_LENGTH', actualBytes: iv.length });
    }

    if (authTag.length !== this.authTagLength) {
      throw new SymplaNotConfiguredError({ reason: 'INVALID_AUTH_TAG_LENGTH', actualBytes: authTag.length });
    }

    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // A GCM tag mismatch throws here. The plaintext is a credential, so the error must not
    // echo any part of it — only the failure mode.
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('utf8');
  }

  addAlternateKey(version: number, keyBase64: string): void {
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== this.keyLength) {
      throw new SymplaNotConfiguredError({ reason: 'INVALID_ALTERNATE_KEY_LENGTH', keyVersion: version });
    }

    this.alternateKeys.set(version, key);
  }

  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }
}
