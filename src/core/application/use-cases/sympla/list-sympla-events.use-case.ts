import type { ISymplaEventLinkRepository } from '@/core/domain/contracts';

import type { SymplaClientProvider } from '../../services/sympla-client.provider';

export interface SymplaEventOption {
  symplaEventIdHash: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  url: string | null;
  published: boolean;
  cancelled: boolean;
  /** Already linked to a ONE-ID event — the picker shows it, disabled. */
  linkedEventId: string | null;
}

/** Sympla allows 200 per page; two pages is plenty for a producer's picker. */
const MAX_EVENTS = 200;

export class ListSymplaEventsUseCase {
  constructor(
    private readonly clientProvider: SymplaClientProvider,
    private readonly linkRepository: ISymplaEventLinkRepository,
  ) {}

  async execute(organizationId: string): Promise<SymplaEventOption[]> {
    const { client } = await this.clientProvider.forOrganization(organizationId);

    const links = await this.linkRepository.listByOrganization(organizationId);
    const linkedByHash = new Map(links.map((link) => [link.symplaEventIdHash, link.eventId]));

    const options: SymplaEventOption[] = [];

    for await (const event of client.iterateEvents({ published: 'all', fieldSort: 'start_date', sort: 'desc' })) {
      options.push({
        symplaEventIdHash: event.id,
        name: event.name,
        startsAt: event.start_date ?? null,
        endsAt: event.end_date ?? null,
        imageUrl: event.image ?? null,
        url: event.url ?? null,
        published: event.published ?? false,
        cancelled: event.cancelled ?? false,
        linkedEventId: linkedByHash.get(event.id) ?? null,
      });

      if (options.length >= MAX_EVENTS) break;
    }

    return options;
  }
}
