import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { SecretCipherService } from '@/core/infrastructure/providers/secret-cipher.service';

const KEY = randomBytes(32).toString('base64');
const OTHER_KEY = randomBytes(32).toString('base64');

describe('SecretCipherService', () => {
  it('round-trips a token', () => {
    const cipher = new SecretCipherService(KEY);
    const token = 'sympla_s_token_abc123';

    const encrypted = cipher.encrypt(token);

    expect(encrypted.ciphertext).not.toContain(token);
    expect(cipher.decrypt(encrypted)).toBe(token);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const cipher = new SecretCipherService(KEY);

    const a = cipher.encrypt('same-token');
    const b = cipher.encrypt('same-token');

    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(cipher.decrypt(a)).toBe(cipher.decrypt(b));
  });

  it('rejects a tampered ciphertext via the GCM auth tag', () => {
    const cipher = new SecretCipherService(KEY);
    const encrypted = cipher.encrypt('sympla-token');

    const tampered = Buffer.from(encrypted.ciphertext, 'base64');
    tampered[0] ^= 0xff;

    expect(() => cipher.decrypt({ ...encrypted, ciphertext: tampered.toString('base64') })).toThrow();
  });

  it('cannot decrypt with a different key', () => {
    const encrypted = new SecretCipherService(KEY).encrypt('sympla-token');

    expect(() => new SecretCipherService(OTHER_KEY).decrypt(encrypted)).toThrow();
  });

  it('decrypts with an alternate key registered for an older version', () => {
    const legacy = new SecretCipherService(OTHER_KEY);
    const encrypted = legacy.encrypt('legacy-token');

    const current = new SecretCipherService(KEY);
    current.addAlternateKey(encrypted.version, OTHER_KEY);

    expect(current.decrypt(encrypted)).toBe('legacy-token');
  });

  it('refuses to start without a key', () => {
    expect(() => new SecretCipherService(undefined)).toThrowError(/não está configurada/);
  });

  it('refuses a key of the wrong length', () => {
    expect(() => new SecretCipherService(randomBytes(16).toString('base64'))).toThrowError(/não está configurada/);
  });

  it('never leaks the plaintext in the error of an unknown key version', () => {
    const cipher = new SecretCipherService(KEY);
    const encrypted = cipher.encrypt('super-secret-token');

    try {
      cipher.decrypt({ ...encrypted, version: 99 });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain('super-secret-token');
    }
  });
});
