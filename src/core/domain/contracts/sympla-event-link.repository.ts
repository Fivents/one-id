import type { SymplaEventLinkEntity } from '../entities/sympla-event-link.entity';

export interface CreateSymplaEventLinkData {
  eventId: string;
  symplaEventIdHash: string;
  symplaUrl?: string | null;
  imageUrl?: string | null;
  referenceId?: number | null;
  categoryPrimary?: string | null;
  categorySecondary?: string | null;
  hostName?: string | null;
  publishedOnSympla?: boolean;
  cancelledOnSympla?: boolean;
}

export interface ISymplaEventLinkRepository {
  findByEventId(eventId: string): Promise<SymplaEventLinkEntity | null>;
  findBySymplaEventIdHash(symplaEventIdHash: string): Promise<SymplaEventLinkEntity | null>;
  listByOrganization(organizationId: string): Promise<SymplaEventLinkEntity[]>;
  /** Creates the link and flips Event.symplaLinked in one transaction. */
  link(data: CreateSymplaEventLinkData): Promise<SymplaEventLinkEntity>;
  /** Removes the link and clears Event.symplaLinked. Participants are kept. */
  unlink(eventId: string): Promise<boolean>;
}
