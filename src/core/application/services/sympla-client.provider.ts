/**
 * Resolves an organization's stored Sympla credential into a ready client.
 *
 * Every Sympla call in the app goes through here, so decryption happens in exactly one place
 * and the plaintext token never has to be passed around between layers.
 */

import type { ISecretCipher, ISymplaConnectionRepository } from '@/core/domain/contracts';
import type { SymplaConnectionEntity } from '@/core/domain/entities';
import { SymplaNotConnectedError } from '@/core/errors';
import { SymplaHttpClient, type SymplaHttpClientOptions } from '@/core/infrastructure/http/sympla/sympla-http.client';

export type SymplaClientFactory = (token: string, options?: Partial<SymplaHttpClientOptions>) => SymplaHttpClient;

export const defaultSymplaClientFactory: SymplaClientFactory = (token, options) =>
  new SymplaHttpClient({ ...options, token });

export interface ResolvedSymplaClient {
  client: SymplaHttpClient;
  connection: SymplaConnectionEntity;
}

export class SymplaClientProvider {
  constructor(
    private readonly connectionRepository: ISymplaConnectionRepository,
    private readonly cipher: ISecretCipher,
    private readonly createClient: SymplaClientFactory = defaultSymplaClientFactory,
  ) {}

  /** Builds a client from a token the caller already holds (connection health check). */
  fromToken(token: string, options?: Partial<SymplaHttpClientOptions>): SymplaHttpClient {
    return this.createClient(token, options);
  }

  async forOrganization(
    organizationId: string,
    options?: Partial<SymplaHttpClientOptions>,
  ): Promise<ResolvedSymplaClient> {
    const connection = await this.connectionRepository.findByOrganizationId(organizationId);

    if (!connection || !connection.isUsable()) {
      throw new SymplaNotConnectedError({ organizationId });
    }

    const token = this.cipher.decrypt(connection.tokenEncrypted);

    return { client: this.createClient(token, options), connection };
  }
}
