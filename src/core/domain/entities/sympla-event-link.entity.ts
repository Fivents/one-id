import { randomUUID } from 'node:crypto';

import { BaseEntity } from './base.entity';

export interface SymplaEventLinkProps {
  id: string;
  eventId: string;
  symplaEventIdHash: string;
  symplaUrl?: string | null;
  imageUrl?: string | null;
  referenceId?: number | null;
  categoryPrimary?: string | null;
  categorySecondary?: string | null;
  hostName?: string | null;
  publishedOnSympla: boolean;
  cancelledOnSympla: boolean;
  lastSeedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SymplaEventLinkEntity extends BaseEntity {
  private constructor(private readonly props: SymplaEventLinkProps) {
    super(props.id);
  }

  static create(props: SymplaEventLinkProps): SymplaEventLinkEntity {
    return new SymplaEventLinkEntity(props);
  }

  static newLink(eventId: string, symplaEventIdHash: string): SymplaEventLinkEntity {
    const now = new Date();

    return new SymplaEventLinkEntity({
      id: randomUUID(),
      eventId,
      symplaEventIdHash,
      publishedOnSympla: false,
      cancelledOnSympla: false,
      lastSeedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get symplaEventIdHash(): string {
    return this.props.symplaEventIdHash;
  }

  get symplaUrl(): string | null | undefined {
    return this.props.symplaUrl;
  }

  get cancelledOnSympla(): boolean {
    return this.props.cancelledOnSympla;
  }

  get lastSeedAt(): Date | null | undefined {
    return this.props.lastSeedAt;
  }

  /** A sync has never run for this event, so the next one must be a full pass. */
  needsFullSync(): boolean {
    return !this.props.lastSeedAt;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
