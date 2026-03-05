import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class DuplicateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(
    id: string,
    overrides: { name: string; slug: string; startsAt: Date; endsAt: Date },
  ): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new DuplicateEventError('Event not found.');
    }

    return this.eventRepository.create({
      name: overrides.name,
      slug: overrides.slug,
      description: event.description ?? undefined,
      timezone: event.timezone,
      address: event.address ?? undefined,
      status: 'DRAFT',
      startsAt: overrides.startsAt,
      endsAt: overrides.endsAt,
      organizationId: event.organizationId,
      printConfigId: event.printConfigId ?? undefined,
    });
  }
}

export class DuplicateEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEventError';
  }
}
