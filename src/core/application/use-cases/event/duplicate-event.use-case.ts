import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';
import { EventNotFoundError } from '@/core/errors';

export class DuplicateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(
    id: string,
    overrides: { name: string; slug: string; startsAt: Date; endsAt: Date },
  ): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    return this.eventRepository.create({
      name: overrides.name,
      slug: overrides.slug,
      description: event.description ?? undefined,
      timezone: event.timezone,
      address: event.address ?? undefined,
      addressDetails: event.addressDetails ?? undefined,
      status: 'DRAFT',
      startsAt: overrides.startsAt,
      endsAt: overrides.endsAt,
      organizationId: event.organizationId,
      printConfigId: event.printConfigId ?? undefined,
    });
  }
}
