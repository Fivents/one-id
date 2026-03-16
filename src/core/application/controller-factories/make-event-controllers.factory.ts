import {
  makeActivateEventUseCase,
  makeCancelEventUseCase,
  makeCompleteEventUseCase,
  makeCreateEventUseCase,
  makeDeleteEventUseCase,
  makeDuplicateEventUseCase,
  makeGetEventUseCase,
  makeListEventsUseCase,
  makePublishEventUseCase,
  makeUpdateEventUseCase,
} from '@/core/infrastructure/factories';

import {
  ActivateEventController,
  CancelEventController,
  CompleteEventController,
  CreateEventController,
  DeleteEventController,
  DuplicateEventController,
  GetEventController,
  ListEventsController,
  PublishEventController,
  UpdateEventController,
} from '../controllers/event';

export function makeCreateEventController(): CreateEventController {
  return new CreateEventController(makeCreateEventUseCase());
}

export function makeGetEventController(): GetEventController {
  return new GetEventController(makeGetEventUseCase());
}

export function makeUpdateEventController(): UpdateEventController {
  return new UpdateEventController(makeUpdateEventUseCase());
}

export function makeDeleteEventController(): DeleteEventController {
  return new DeleteEventController(makeDeleteEventUseCase());
}

export function makeListEventsController(): ListEventsController {
  return new ListEventsController(makeListEventsUseCase());
}

export function makePublishEventController(): PublishEventController {
  return new PublishEventController(makePublishEventUseCase());
}

export function makeActivateEventController(): ActivateEventController {
  return new ActivateEventController(makeActivateEventUseCase());
}

export function makeCancelEventController(): CancelEventController {
  return new CancelEventController(makeCancelEventUseCase());
}

export function makeCompleteEventController(): CompleteEventController {
  return new CompleteEventController(makeCompleteEventUseCase());
}

export function makeDuplicateEventController(): DuplicateEventController {
  return new DuplicateEventController(makeDuplicateEventUseCase());
}
