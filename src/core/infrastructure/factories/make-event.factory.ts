import { containerService } from '@/core/application/services';
import { ActivateEventUseCase } from '@/core/application/use-cases/event/activate-event.use-case';
import { CancelEventUseCase } from '@/core/application/use-cases/event/cancel-event.use-case';
import { CompleteEventUseCase } from '@/core/application/use-cases/event/complete-event.use-case';
import { CreateEventUseCase } from '@/core/application/use-cases/event/create-event.use-case';
import { DeleteEventUseCase } from '@/core/application/use-cases/event/delete-event.use-case';
import { DuplicateEventUseCase } from '@/core/application/use-cases/event/duplicate-event.use-case';
import { GetEventUseCase } from '@/core/application/use-cases/event/get-event.use-case';
import { ListEventsUseCase } from '@/core/application/use-cases/event/list-events.use-case';
import { PublishEventUseCase } from '@/core/application/use-cases/event/publish-event.use-case';
import { UpdateEventUseCase } from '@/core/application/use-cases/event/update-event.use-case';

export function makeCreateEventUseCase(): CreateEventUseCase {
  return new CreateEventUseCase(containerService.getEventRepository());
}

export function makeUpdateEventUseCase(): UpdateEventUseCase {
  return new UpdateEventUseCase(containerService.getEventRepository());
}

export function makePublishEventUseCase(): PublishEventUseCase {
  return new PublishEventUseCase(containerService.getEventRepository());
}

export function makeActivateEventUseCase(): ActivateEventUseCase {
  return new ActivateEventUseCase(containerService.getEventRepository());
}

export function makeCancelEventUseCase(): CancelEventUseCase {
  return new CancelEventUseCase(containerService.getEventRepository());
}

export function makeCompleteEventUseCase(): CompleteEventUseCase {
  return new CompleteEventUseCase(containerService.getEventRepository());
}

export function makeDeleteEventUseCase(): DeleteEventUseCase {
  return new DeleteEventUseCase(containerService.getEventRepository());
}

export function makeListEventsUseCase(): ListEventsUseCase {
  return new ListEventsUseCase(containerService.getEventRepository());
}

export function makeGetEventUseCase(): GetEventUseCase {
  return new GetEventUseCase(containerService.getEventRepository());
}

export function makeDuplicateEventUseCase(): DuplicateEventUseCase {
  return new DuplicateEventUseCase(containerService.getEventRepository());
}
