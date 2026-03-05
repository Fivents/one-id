import {
  makeGetParticipantUseCase,
  makeListParticipantsUseCase,
  makeRegisterParticipantUseCase,
  makeRemoveParticipantUseCase,
  makeUpdateParticipantUseCase,
} from '@/core/infrastructure/factories';

import {
  GetParticipantController,
  ListParticipantsController,
  RegisterParticipantController,
  RemoveParticipantController,
  UpdateParticipantController,
} from '../controllers/event-participant';

export function makeRegisterParticipantController(): RegisterParticipantController {
  return new RegisterParticipantController(makeRegisterParticipantUseCase());
}

export function makeGetParticipantController(): GetParticipantController {
  return new GetParticipantController(makeGetParticipantUseCase());
}

export function makeUpdateParticipantController(): UpdateParticipantController {
  return new UpdateParticipantController(makeUpdateParticipantUseCase());
}

export function makeListParticipantsController(): ListParticipantsController {
  return new ListParticipantsController(makeListParticipantsUseCase());
}

export function makeRemoveParticipantController(): RemoveParticipantController {
  return new RemoveParticipantController(makeRemoveParticipantUseCase());
}
