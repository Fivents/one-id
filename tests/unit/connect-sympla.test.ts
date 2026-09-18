import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { SymplaClientProvider } from '@/core/application/services/sympla-client.provider';
import { ConnectSymplaUseCase } from '@/core/application/use-cases/sympla/connect-sympla.use-case';
import { DisconnectSymplaUseCase } from '@/core/application/use-cases/sympla/disconnect-sympla.use-case';
import { GetSymplaConnectionStatusUseCase } from '@/core/application/use-cases/sympla/get-sympla-connection-status.use-case';
import { SymplaNotConnectedError } from '@/core/errors';
import { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

import {
  FakeSecretCipher,
  InMemoryAuditLogRepository,
  InMemorySymplaConnectionRepository,
} from '../fakes/sympla-fakes';

const FIXTURES = path.resolve(__dirname, '../fixtures/sympla');
const ORG = 'org-1';

function fixtureText(name: string): string {
  return readFileSync(path.join(FIXTURES, name), 'utf8');
}

interface HarnessOptions {
  /** Status the fake Sympla API answers the health check with. */
  healthCheckStatus?: number;
}

function makeHarness({ healthCheckStatus = 200 }: HarnessOptions = {}) {
  const repository = new InMemorySymplaConnectionRepository();
  const cipher = new FakeSecretCipher();
  const auditLog = new InMemoryAuditLogRepository();
  const sentTokens: string[] = [];

  const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    sentTokens.push(headers.s_token);

    if (healthCheckStatus !== 200) {
      return new Response(fixtureText('problem-401.json'), {
        status: healthCheckStatus,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(fixtureText('events-page.json'), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;

  const clientProvider = new SymplaClientProvider(
    repository,
    cipher,
    (token) => new SymplaHttpClient({ token, fetchImpl, maxRetries: 0 }),
  );

  return {
    repository,
    cipher,
    auditLog,
    fetchImpl,
    sentTokens,
    connect: new ConnectSymplaUseCase(repository, cipher, clientProvider, auditLog),
    disconnect: new DisconnectSymplaUseCase(repository, auditLog),
    status: new GetSymplaConnectionStatusUseCase(repository),
    clientProvider,
  };
}

describe('ConnectSymplaUseCase', () => {
  it('health-checks the token, then stores it encrypted', async () => {
    const harness = makeHarness();

    const connection = await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });

    expect(harness.fetchImpl).toHaveBeenCalledOnce();
    expect(harness.sentTokens).toEqual(['s-token-123456']);
    expect(connection.isActive).toBe(true);

    const stored = await harness.repository.findByOrganizationId(ORG);
    expect(stored?.tokenEncrypted.ciphertext).not.toContain('s-token-123456');
    expect(harness.cipher.decrypt(stored!.tokenEncrypted)).toBe('s-token-123456');
  });

  it('does not persist anything when the token is rejected', async () => {
    const harness = makeHarness({ healthCheckStatus: 401 });

    await expect(harness.connect.execute({ organizationId: ORG, token: 'bad-token-123' })).rejects.toMatchObject({
      code: 'SYMPLA_UNAUTHORIZED',
    });

    expect(await harness.repository.findByOrganizationId(ORG)).toBeNull();
  });

  it('rejects a blank token before touching the network', async () => {
    const harness = makeHarness();

    await expect(harness.connect.execute({ organizationId: ORG, token: '   ' })).rejects.toMatchObject({
      httpStatus: 400,
    });
    expect(harness.fetchImpl).not.toHaveBeenCalled();
  });

  it('audits the connection without recording the token', async () => {
    const harness = makeHarness();

    await harness.connect.execute({ organizationId: ORG, token: 's-token-123456', userId: 'user-9' });

    expect(harness.auditLog.entries).toHaveLength(1);
    expect(harness.auditLog.entries[0]).toMatchObject({
      action: 'SYMPLA_CONNECTION_CREATED',
      organizationId: ORG,
      userId: 'user-9',
    });
    expect(JSON.stringify(harness.auditLog.entries)).not.toContain('s-token-123456');
  });

  it('keeps the connection usable when the audit write fails', async () => {
    const harness = makeHarness();
    vi.spyOn(harness.auditLog, 'create').mockRejectedValueOnce(new Error('audit down'));

    await expect(harness.connect.execute({ organizationId: ORG, token: 's-token-123456' })).resolves.toBeDefined();
    expect(await harness.repository.findByOrganizationId(ORG)).not.toBeNull();
  });

  it('reconnecting replaces the token and clears the failure streak', async () => {
    const harness = makeHarness();

    await harness.connect.execute({ organizationId: ORG, token: 'first-token-1' });
    await harness.repository.recordSyncOutcome(ORG, { status: 'FAILED' });
    await harness.repository.recordSyncOutcome(ORG, { status: 'FAILED' });
    expect((await harness.repository.findByOrganizationId(ORG))?.consecutiveFailures).toBe(2);

    await harness.connect.execute({ organizationId: ORG, token: 'second-token-1' });

    const stored = await harness.repository.findByOrganizationId(ORG);
    expect(harness.cipher.decrypt(stored!.tokenEncrypted)).toBe('second-token-1');
    expect(stored?.consecutiveFailures).toBe(0);
  });
});

describe('SymplaConnectionEntity serialization', () => {
  it('never exposes the token through toJSON', async () => {
    const harness = makeHarness();
    const connection = await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });

    const serialized = JSON.stringify(connection.toJSON());

    expect(serialized).not.toContain('s-token-123456');
    expect(serialized).not.toContain('tokenEncrypted');
    expect(serialized).not.toContain('ciphertext');
  });

  it('flags a connection that needs attention after 3 consecutive failures', async () => {
    const harness = makeHarness();
    await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });

    for (let i = 0; i < 3; i += 1) {
      await harness.repository.recordSyncOutcome(ORG, { status: 'FAILED' });
    }

    expect((await harness.status.execute(ORG))?.needsAttention()).toBe(true);
  });
});

describe('DisconnectSymplaUseCase', () => {
  it('deactivates an existing connection', async () => {
    const harness = makeHarness();
    await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });

    await harness.disconnect.execute({ organizationId: ORG, userId: 'user-9' });

    expect((await harness.repository.findByOrganizationId(ORG))?.isActive).toBe(false);
    expect(harness.auditLog.entries.at(-1)).toMatchObject({ action: 'SYMPLA_CONNECTION_REMOVED' });
  });

  it('throws when there is nothing to disconnect', async () => {
    const harness = makeHarness();

    await expect(harness.disconnect.execute({ organizationId: ORG })).rejects.toThrowError(SymplaNotConnectedError);
  });
});

describe('SymplaClientProvider', () => {
  it('builds a client from the stored token', async () => {
    const harness = makeHarness();
    await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });
    harness.sentTokens.length = 0;

    const { client } = await harness.clientProvider.forOrganization(ORG);
    await client.listEvents();

    expect(harness.sentTokens).toEqual(['s-token-123456']);
  });

  it('refuses a deactivated connection', async () => {
    const harness = makeHarness();
    await harness.connect.execute({ organizationId: ORG, token: 's-token-123456' });
    await harness.disconnect.execute({ organizationId: ORG });

    await expect(harness.clientProvider.forOrganization(ORG)).rejects.toThrowError(SymplaNotConnectedError);
  });

  it('refuses an organization that never connected', async () => {
    const harness = makeHarness();

    await expect(harness.clientProvider.forOrganization('other-org')).rejects.toThrowError(SymplaNotConnectedError);
  });
});
